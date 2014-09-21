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

    var LS = window.localStorage;

    var Event = Backbone.Model.extend({

    });

    var Events = Backbone.Collection.extend({
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
            events: []
        },

        initialize: function() {
            console.log("initialize month");
        },

        parse: function(data) {
            data.events = new Events(data.events);
            return data;
        }
    });

    var MonthView = Backbone.View.extend({
        tagName:  "td",
        template: _.template("<div class='month<%= className %>'><button class='add_event'>Add</button></div>"),
        
        events: {
            "mouseenter": "showAddButton",
            "mouseleave": "hideAddButton",
            "click .add_event" : "addEvent"
        },

        initialize: function() {
            this.listenTo(this.model.get("events"), "add", this.render);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            _(this.model.get("events").models).each(function(event) {
                var eventView = new EventView({ model: event });
                this.$el.append(eventView.render().el);
            }, this);
            return this;
        },

        showAddButton: function() {
            this.$(".add_event").show();
        },

        hideAddButton: function() {
            this.$(".add_event").hide();

        },

        addEvent: function() {
            var event = prompt("What event?");
            this.model.get("events").add([new Event({event: event})]);
            OneThousandMonths.save();
            console.log(OneThousandMonths.get("calendar").at(0).get("events").length);
        }
    });


    var Calendar = Backbone.Collection.extend({
        model: Month
    });

    var CalendarApp = Backbone.Model.extend({
        defaults: {
            calendar: []
        },
        localStorage: new Backbone.LocalStorage("1000-months"),
        initialize: function() {
            console.log("initialize calendar app");
            this.set("calendar", new Calendar());
        },

        parse: function(data) {
            data.calendar = new Calendar(data.calendar);
            return data;
        }
    });

    var OneThousandMonths = new CalendarApp({ id: "1000-month" });

    var AppView = Backbone.View.extend({
        el: $("#calendar"),

        initialize: function () {
            OneThousandMonths.fetch({ add: true });
            console.log(OneThousandMonths.get("calendar").at(0).get("events").length);
            if (OneThousandMonths.get("birth_year") && OneThousandMonths.get("birth_month")) {
                this.render();
            } else {
                $("#setup").show();
                $("#submit_setup").on("click", $.proxy(function() {
                    var birthMonth = $("#birth_month").val();
                    if (birthMonth.length != 6 || isNaN(parseInt(birthMonth, 10))) {
                        $("#setup_error").text("Six digits, please?");
                        return;
                    }
                    OneThousandMonths.set("birth_year", parseInt(birthMonth.substring(0, 4), 10));
                    OneThousandMonths.set("birth_month", parseInt(birthMonth.substring(4, 6), 10));
                    this.setupCalendar();
                }, this));

            }
        },

        setupCalendar: function() {
            var year = OneThousandMonths.get("birth_year");
            var month = OneThousandMonths.get("birth_month");
            var calendar = OneThousandMonths.get("calendar");

            for (var i = 0; i < NUM_MONTHS; i++) {
                calendar.add(new Month({ year: year, month: month, className: "alive" }));
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
                        row.append("<td></td><div class='month'></div></td>")
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
    var el;
    for (var i=0; i<elements.length; i++) {
        el = $(elements[i]);
        if (el.offset().top >= scroll && el.is(':visible')){
            var tableHeader = $("#table_header").detach();
            tableHeader.insertBefore(el);
            break;
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