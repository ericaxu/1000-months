$(function () {

    var MONTHS = [
        { name: "January", abbr: "Jan" },
        { name: "February", abbr: "Feb" },
        { name: "March", abbr: "Mar" },
        { name: "April", abbr: "Apr" },
        { name: "May", abbr: "May" },
        { name: "June", abbr: "Jun" },
        { name: "July", abbr: "Jul" },
        { name: "August", abbr: "Aug" },
        { name: "September", abbr: "Sept" },
        { name: "October", abbr: "Oct" },
        { name: "November", abbr: "Nov" },
        { name: "December", abbr: "Dec" }
    ];

    var NUM_MONTHS = 1000;

    var YOUNG_AGE = 18;

    var OLD_AGE = 35;

    var SHORT_LIFE = 60 * 12;

    var LONG_LIFE = 100 * 12;

    var MIN_BIRTH_YEAR = (new Date).getFullYear() - 150;

    var EARLY_PLANNER_AGE = 10;

    var DEAD_TEXT = "Not around";

    var Event = Backbone.Model.extend({
        toJSON: function() {
            return _.pick(this.attributes, "event");
        }
    });

    var EventList = Backbone.Collection.extend({
        model: Event
    });

    var EventView = Backbone.View.extend({
        template: _.template("<div class='event'><%= event %><a class='delete_event'>x</a></div>"),

        events: {
            "mouseenter": "showDeleteButton",
            "mouseleave": "hideDeleteButton"
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        showDeleteButton: function() {
            $(this.el).find(".add_event").show();
        },

        hideDeleteButton: function() {
            $(this.el).find(".add_event").hide();

        }
    });

    var Month = Backbone.Model.extend({
        defaults: {
            eventList: new EventList()
        },

        parse: function(data) {
            data.eventList = new EventList(data.eventList);
            return data;
        }
    });

    var MonthView = Backbone.View.extend({
        tagName: "td",

        className: "month",

        template: _.template("<button class='add_event'>Add</button>"),
        
        events: {
            "mouseenter": "showAddButton",
            "mouseleave": "hideAddButton",
            "click .add_event" : "addEvent"
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));

            var now = new Date();
            if (this.model.get("year") == now.getFullYear() && this.model.get("month") == now.getMonth() + 1) {
                this.$el.addClass("current");
            } else if (this.model.get("year") == now.getFullYear()) {
                this.$el.addClass("current-year");
            }

            for(var i = 0; i < this.model.get("eventList").length; i++) {
                var eventView = new EventView({ model: new Event({ event: this.model.get("eventList")[i].event }) });
                this.$el.append(eventView.render().el);
            }
            return this;
        },

        showAddButton: function() {
            this.$(".add_event").css("visibility", "visible");
        },

        hideAddButton: function() {
            this.$(".add_event").css("visibility", "hidden");

        },

        addEvent: function() {
            var event = prompt("Where happened?");
            if (event != null && event != "") {
                this.model.get("eventList").push({event: event});
                OneThousandMonths.save();
                this.render();
            }
        }
    });


    var Calendar = Backbone.Collection.extend({
        model: Month
    });

    var CalendarApp = Backbone.Model.extend({
        defaults: {
            calendar: new Calendar()
        },
        localStorage: new Backbone.LocalStorage("1000-months"),

        parse: function(data) {
            if (data.calendar) {
                data.calendar = new Calendar(data.calendar);
            }
            return data;
        }
    });

    var OneThousandMonths = new CalendarApp({ id: "1000-month" });

    var AppView = Backbone.View.extend({
        el: $("#calendar"),

        initialize: function () {
            OneThousandMonths.fetch();
            if (OneThousandMonths.get("birth_year") && OneThousandMonths.get("birth_month")) {
                $("#calendar").show();
                this.render();
            } else {
                $("#setup").show();
                $("#setup input").on("blur", this.checkInput);
                $("#submit_setup").on("click", $.proxy(function() {
                    if (this.checkInput()) {
                        var birthMonth = $("#birth_month").val();
                        var year = parseInt(birthMonth.substring(0, 4), 10);
                        var month = parseInt(birthMonth.substring(4, 6), 10);
                        OneThousandMonths.set("birth_year", year);
                        OneThousandMonths.set("birth_month", month);
                        this.setupCalendar();
                    }
                }, this));

            }
        },

        checkInput: function() {
            $(".error, .comment").hide();

            var valid = true;

            var birthMonth = $("#birth_month").val();
            var life_exp = parseInt($("#life_expectancy").val(), 10);
            var year = parseInt(birthMonth.substring(0, 4), 10);
            var month = parseInt(birthMonth.substring(4, 6), 10);

            if (month < 1 || month > 12) {
                $(".birth.error").text("Are you sure you were born in the " + month + "th month? Double check with your parents?").show();
                valid = false;
            }
            if (year > (new Date).getFullYear()) {
                $(".birth.error").text("Are you the guy who took my flux capacitor?!").show();
                valid = false;
            }
            if (birthMonth.length != 6 || isNaN(parseInt(birthMonth, 10))) {
                $(".birth.error").text("Six digits please?").show();
                valid = false;
            }

            if (isNaN(life_exp)) {
                $(".life_exp.error").text("A number would be nice.").show();
                valid = false;
            } else if (life_exp > LONG_LIFE) {
                $(".life_exp.comment").text("Living that long can be boring. Just saying.").show();
            } else if (life_exp < SHORT_LIFE) {
                $(".life_exp.comment").text("Really? Are you the kind of person who hates salad and never workout?").show();
            }

            if ((new Date).getFullYear() - year <= YOUNG_AGE && year <= (new Date).getFullYear()) {
                $(".birth.comment").text("I'm jealous of how young you are.").show();
            } else if ((new Date).getFullYear() - year >= OLD_AGE) {
                $(".birth.comment").text("I know, right? Getting old sucks.").show();
            } else if (year < MIN_BIRTH_YEAR) {
                $(".birth.comment").text("Wow, I'm amazed that you are still not dead.").show();
            }

            return valid;
        },

        setupCalendar: function() {
            var year = OneThousandMonths.get("birth_year");
            var month = OneThousandMonths.get("birth_month");
            var calendar = OneThousandMonths.get("calendar");

            for (var i = 0; i < NUM_MONTHS; i++) {
                calendar.add(new Month({ year: year, month: month, className: " alive" }));
                if (month >= 12) {
                    month = (month + 1) % 12;
                    year++;
                } else {
                    month++;
                }
            }
            OneThousandMonths.set("death_year", year);
            OneThousandMonths.set("death_month", month);
            OneThousandMonths.save();

            $("#setup").hide();
            $("#calendar").show();
            this.render();
        },

        addMonth: function(month, el) {
            var view = new MonthView({model: month});
            el.append(view.render().el);
        },

        render: function () {
            var years = OneThousandMonths.get("duration_years");
            var birthYear = OneThousandMonths.get("birth_year");
            var birthMonth = OneThousandMonths.get("birth_month");
            var deathYear = OneThousandMonths.get("death_year");
            var deathMonth = OneThousandMonths.get("death_month");
            var calendar = OneThousandMonths.get("calendar");

            var monthCount = 0;

            for (var year = birthYear; year <= deathYear; year++) {
                var row = $("<tr/>");
                row.append($("<td/>", { text: year, class: "year" }));
                for (var month = 1; month <= 12; month++) {
                    if ((year == birthYear && month < birthMonth) || (year == deathYear && month >= deathMonth)) {
                        row.append("<td class='month dead'>" + DEAD_TEXT + "</td>");
                    } else {
                        this.addMonth(calendar.at(monthCount), row);
                        monthCount++;
                    }
                }
                this.$("table").append(row);
            }
        }

    });

    var App = new AppView();

});

$(window).on("scroll", function() {
    var headerHeight = $("#table_header").height();
    var scroll = $(window).scrollTop();
    var elements = $("tr:not(#table_header)");
    if (scroll < 5) {
        var tableHeader = $("#table_header").detach();
        tableHeader.insertBefore($(elements[0]));
    } else {
        var el;
        for (var i=0; i<elements.length; i++) {
            el = $(elements[i]);
            if (el.offset().top - headerHeight + 2 >= scroll && el.is(":visible")){
                var tableHeader = $("#table_header").detach();
                tableHeader.insertBefore(el);
                break;
            }
        }
    }

});

//var client = new Dropbox.Client({key: 'fdtruaaps9n9ifu'});

// Try to finish OAuth authorization.
//client.authenticate({interactive: false});

// Redirect to Dropbox to authenticate if client isn't authenticated
//if (!client.isAuthenticated()) client.authenticate();

// Set client for Backbone.DropboxDatastore to work with Dropbox
//Backbone.DropboxDatastore.client = client;

// Client is authenticated and set for Backbone.DropboxDatastore.
// You can use CRUD methods of collection with DropboxDatastore