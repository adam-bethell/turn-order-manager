ipcRenderer.on('open_file', function(event, json) {
    let project_name = json["project_name"];
    $("#project_name").text(project_name);
    $("head title").text(project_name);
});

$(function() {
    Split({
        columnGutters: [{
          track: 1,
          element: document.querySelector('#split_vertical'),
        }],
        rowGutters: [{
          track: 2,
          element: document.querySelector('#split_horizontal'),
        }],
        rowMinSizes: { 1: 300, 3: 45 },
        columnMinSize: 230,
    });
});

class InitiativeRecords {
    constructor() {
        this.records = [];
        this.record_id = 0;
    }

    _order_initiative_records() {
        console.log("_order_initiative_records()");
        let ordered_records = [];
        let lowest_initiative = 99999;
        let lowest_dexterity = 99999;
        let lowest_index = 0;
        while(this.records.length > 0) {
            for (let i = 0; i < this.records.length; i++) {
                let initiative = this.records[i].init;
                let dexterity = this.records[i].dex;
                console.log(i);
                console.log(initiative);
                console.log(dexterity);
                if (initiative < lowest_initiative ||
                    (initiative == lowest_initiative && dexterity < lowest_dexterity)) {
                    lowest_initiative = initiative;
                    lowest_dexterity = dexterity;
                    lowest_index = i;
                    console.log("lowest!")
                }
            }
            console.log(lowest_index);
            ordered_records.unshift(this.records.splice(lowest_index, 1)[0]);
            lowest_initiative = 99999;
            lowest_dexterity = 99999;
            lowest_index = 0;
        }
    
        this.records = ordered_records;
    }
    
    _initiative_record_index_from_id(id) {
        let i;
        let found = false
        for (i = 0; i < this.records.length; i++) {
            if (this.records[i].id == id) {
                found = true;
                break;
            }
        }
    
        if (found) {
            return i;
        }
        return null;
    }

    add_initiative_record (name, init, dex) {
        this.records.push({
            "id": this.record_id++,
            "enabled": true,
            "selected": false,
            "name": name,
            "init": parseInt(init),
            "dex": parseInt(dex),
        });

        this._order_initiative_records();
    }
    
    remove_initiative_record (id) {
        let i = this._initiative_record_index_from_id(id);
        if (i != null) {
            this.records.splice(i, 1);
        }
    }
    
    enable_initiative_record (id) {
        let i = this._initiative_record_index_from_id(id);
        if (i != null) {
            this.records[i].enabled = true;
        }
    }
    
    disable_initiative_record (id) {
        let i = this._initiative_record_index_from_id(id);
        if (i != null) {
            this.records[i].enabled = false;
        }
    }

    deselect_all_records() {
        for (let i = 0; i < this.records.length; i++) {
            this.records[i].selected = false;
        }
    }

    select_first_enabled_record() {
        this.deselect_all_records();

        for (let i = 0; i < this.records.length; i++) {
            if (this.records[i].enabled) {
                this.records[i].selected = true;
                break;
            }
        }
    }

    select_next_enabled_record() {
        let index_of_selected = null;
        let index_of_next_selected = null;
        for (let i = 0; i < this.records.length; i++) {
            if (this.records[i].selected) {
                index_of_selected = i;
                this.records[i].selected = false;
            }
            else if (index_of_selected != null && this.records[i].enabled == true) {
                index_of_next_selected = i;
                this.records[i].selected = true;
                return;
            }
        }

        this.select_first_enabled_record();
    }

    get_selected_record() {
        for (let i = 0; i < this.records.length; i++) {
            if (this.records[i].selected) {
                return this.records[i];
            }
        }
    }
}

$(function() {
    //=======================================
    // Initiative Tracker
    //=======================================
    let $initiative_records = $("#initiative_tracker tbody");
    let initiative_records = new InitiativeRecords();
    function show_initiative_records() {
        $initiative_records.empty();
        for (let i = 0; i < initiative_records.records.length; i++) {
            let record = initiative_records.records[i];
            $initiative_records.append(initiative_record_html(record));
        }
    }

    let $enabled_records_buttons = $("<td>")
        .append($("<input>").attr({"type":"button","value":"Disable"}).addClass("disable_initiative_record"));

    let $disabled_records_buttons = $("<td>")
        .append($("<input>").attr({"type":"button","value":"Enable"}).addClass("enable_initiative_record"))
        .append($("<input>").attr({"type":"button","value":"Delete"}).addClass("delete_initiative_record"));

    function initiative_record_html(record) {
        let $new_row = $("<tr>");
        $new_row.attr("data-record_id", record.id);

        if (record.enabled) {
            $new_row.addClass("enabled");
        }
        else {
            $new_row.addClass("disabled");
        }

        if (record.selected) {
            $new_row.addClass("initiative_record_highlighted");
        }

        $new_row.append($("<td>").text(record.name));
        $new_row.append($("<td>").text(record.init));
        $new_row.append($("<td>").text(record.dex));

        if (record.enabled) {
            $new_row.append($enabled_records_buttons.clone())
        }
        else {
            $new_row.append($disabled_records_buttons.clone())
        }
        
        return $new_row
    }

    $("#create_initiative_record").on('click', function() {
        console.log("create!");
        let name = $("#initiative_tracker .name-input").val();
        let init = $("#initiative_tracker .initiative-input").val();
        let dex = $("#initiative_tracker .dexterity-input").val();
        if (name == "") {
            return
        }
        if (init == "") {
            init = 0;
        }
        if (dex == "") {
            dex = 0;
        }

        console.log()
        initiative_records.add_initiative_record(name, init, dex);
        show_initiative_records();

        $("#initiative_tracker .name-input").val("");
        $("#initiative_tracker .initiative-input").val("");
        $("#initiative_tracker .dexterity-input").val("");

        $("#initiative_tracker .name-input").trigger('focus');
    });

    $("#delete_all_initiative_records").on('click', function() {
        initiative_records.records.length = 0;
        show_initiative_records();
    });

    $("#initiative_tracker").on("click",".disable_initiative_record", function() {
        let id = $(this).closest("tr").attr("data-record_id");

        initiative_records.disable_initiative_record(id);
        show_initiative_records();
    });

    $("#initiative_tracker").on("click",".enable_initiative_record", function() {
        let id = $(this).closest("tr").attr("data-record_id");

        initiative_records.enable_initiative_record(id);
        show_initiative_records();
    });

    $("#initiative_tracker").on("click",".delete_initiative_record", function() {
        let id = $(this).closest("tr").attr("data-record_id");

        initiative_records.remove_initiative_record(id);
        show_initiative_records();
    });

    //=======================================
    // Timer & History
    //=======================================
    // Timer
    let $timer_time = $("#timer #clock");
    let $start_button = $("#stop_watch_start");
    let $pause_button = $("#stop_watch_pause");
    let $stop_button = $("#stop_watch_stop");
    let $next_player_button = $("#stop_watch_next_player");

    $pause_button.prop("disabled", true);
    $stop_button.prop("disabled", true);
    $next_player_button.prop("disabled", true);

    // History
    let $history_records = $("#history tbody");

    let turn_count = [];

    let timer_interval;
    let previous_time = "";
    let time_elapsed = 0;
    let time = 0;
    let paused = false;

    $start_button.on("click", function() {
        if (paused) {
            paused = false;
        }
        else {
            previous_time = new Date().getTime();
            time_elapsed = 0;
            timer_interval = setInterval(stop_watch_process, 1);
            initiative_records.select_first_enabled_record();
            show_initiative_records();
            $history_records.empty();
        }

        $start_button.prop("disabled", true);
        $pause_button.prop("disabled", false);
        $stop_button.prop("disabled", false);
        $next_player_button.prop("disabled", false);
    });

    $stop_button.on("click", function() {
        clearInterval(timer_interval);

        $start_button.prop("disabled", false);
        $pause_button.prop("disabled", true);
        $stop_button.prop("disabled", true);
        $next_player_button.prop("disabled", true);

        paused = false;
        turn_count = [];

        initiative_records.deselect_all_records();
        show_initiative_records();
    });

    $pause_button.on("click", function() {
        paused = true;

        $start_button.prop("disabled", false);
        $pause_button.prop("disabled", true);
        $stop_button.prop("disabled", false);
        $next_player_button.prop("disabled", true);
    });


    function stop_watch_process() {
        let current_time = new Date().getTime();
        let diff = (current_time - previous_time);
        previous_time += diff;
        if (!paused) {
            time_elapsed += diff;
        }

        $timer_time.text(format_time(time_elapsed));
    }

    function format_time(ms) {
        let hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((ms % (1000 * 60)) / 1000);
        let milliseconds = Math.floor(ms % 1000);

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        milliseconds = (milliseconds < 100) ? (milliseconds < 10) ? "00" + milliseconds : "0" + milliseconds : milliseconds;

        return hours + ":" + minutes + ":" + seconds + "." + milliseconds
    }

    // History
    $next_player_button.on("click", function() {
        let record = initiative_records.get_selected_record();
        initiative_records.select_next_enabled_record();
        show_initiative_records();
        if (record == null) {
            return
        }

        $new_record = create_history_record(record, format_time(time_elapsed));
        $history_records.prepend($new_record);

        time_elapsed = 0;
    });

    function create_history_record(record, time) {
        $new_row = $("<tr>");
        $new_row.append($("<td>").text(record.name));
        $new_row.append($("<td>").text(time));
        $new_row.append($("<td>").text(get_turn_count(record.id)));
        return $new_row
    }

    function get_turn_count(id) {
        if (turn_count[id] == null) {
            turn_count[id] = 0;
        }

        turn_count[id]++;
        return turn_count[id];
    }
});
