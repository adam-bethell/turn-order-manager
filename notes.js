const md = require('markdown-it')();
const { ipcRenderer } = require('electron');

$(function() {
    let notes_json = [];
    let current_note = null;

    ipcRenderer.on('open_file', function(event, json) {
        notes_json = json["notes"];
        if (notes_json.length > 0) {
            $("#notes_text").val(notes_json[0]["body"]);
            current_note = notes_json[0]["title"];
            populate_notes_table(notes_json[0]["title"]);
            $("#notes_markdown").empty();
            $("#notes_markdown").append(render_tom_markdown(notes_json[0]["body"]));
        }
    });

    ipcRenderer.on('save_file', function(event, json) {
        update_current_note_in_json();
        json["notes"] = notes_json;
        event.sender.send("json_updated", json);
    });

    function update_current_note_in_json() {
        let found = false;
        for (let i = 0; i < notes_json.length; i++) {
            if (notes_json[i]["title"] == current_note) {
                found = true;
                notes_json[i]["body"] = $("#notes_text").val();
                break;
            }
        }
    }

    populate_notes_table();

    $("#notes_render_markdown").prop("disabled", true);
    $("#notes_text").hide();
    $("#notes_filename_new").hide();
    $("#notes_new_confirm").hide();

    $("#notes_render_markdown").on("click", function() {
        $("#notes_render_markdown").prop("disabled", true);
        $("#notes_render_text").prop("disabled", false);
        $("#notes_markdown").show();
        $("#notes_text").hide();

        let text = $("#notes_text").val();
        
        $("#notes_markdown").empty();
        $("#notes_markdown").append(render_tom_markdown(text));
    });

    $("#notes_render_text").on("click", function() {
        $("#notes_render_markdown").prop("disabled", false);
        $("#notes_render_text").prop("disabled", true);
        $("#notes_markdown").hide();
        $("#notes_text").show();
    });

    function populate_notes_table(selected) {
        $tbody = $("#notes_browser tbody");
        $tbody.empty();

        let notes = [];
        if (notes_json != null && notes_json.length > 0) {
            for (let i = 0; i < notes_json.length; i++) {
                notes.push(notes_json[i]["title"]);
            }
        }

        for (let i = 0; i < notes.length; i++) {
            let $tr = $("<tr>").append($("<td>").text(notes[i])).append("<td>");
            if (notes[i] == selected) {
                $tr.addClass("highlight")
            }
            $tbody.append($tr);
        }
    }

    function render_tom_markdown(text) {
        // Render markdown
        let markdown = md.render(text);
        $note = $('<div/>').html(markdown);
        
        // Check tables for lookup tables
        $note.find("table").each(function() {
            // Check first column has a valid dice equation
            let $first_col = $(this).find("thead tr th").first();
            let col_text = $first_col.text();
            if (dice_equation_is_valid(col_text)) {
                $first_col.empty()
                $first_col.append($("<input>").attr({
                    "type": "button",
                    "value": col_text,
                }).addClass("notes_lookup_table_roll"));
            }
        });

        return $note
    }

    $("#notes_markdown").on("click", ".notes_lookup_table_roll", function() {
        // Roll dice against a lookup table
        let dice_equation = $(this).val();
        let result = dice_equation_parse(dice_equation)["result"];

        // Highlight matching rows
        $(this).closest("table").find("tbody tr").each(function() {
            let row_value = $(this).find("td").first().text();
            if (row_value == result) {
                $(this).addClass("highlight");
            }
            else {
                $(this).removeClass("highlight");
            }
        });
    });

    $("#notes_browser").on("click", "tbody tr", function() {
        update_current_note_in_json();
        current_note = $(this).children().first().text();
        let body = get_current_note_body_from_json();
        $("#notes_text").val(body);
        $("#notes_markdown").empty();
        $("#notes_markdown").append(render_tom_markdown(body));
        populate_notes_table(current_note);
    });

    function get_current_note_body_from_json() {
        for (let i = 0; i < notes_json.length; i++) {
            if (notes_json[i]["title"] == current_note) {
                return notes_json[i]["body"];
            }
        }
    }

    $("#notes_new").on("click", function() {
        $("#notes_new").hide();
        $new_note_input = $("<tr>").append($("<td>").append($("<input>").addClass("new_note_input"))).append($("<td>"));
        $("#notes_browser thead").append($new_note_input);
    });

    $("#notes_browser").on("focusout", ".new_note_input", function() {
        console.log("focus out!");
        let new_note_name = $(this).val();
        let found = false;
        do {
            found = false;
            for (let i = 0; i < notes_json.length; i++) {
                if (notes_json[i]["title"] == new_note_name) {
                    found = true;
                    new_note_name += "_";
                }
            }
        } while(found);

        notes_json.push({
            "title": new_note_name,
            "body": ""
        });

        $("#notes_text").val("")
        $("#notes_markdown").empty();

        current_note = new_note_name;
        populate_notes_table(new_note_name);
        $("#notes_browser thead tr").last().remove();
        $("#notes_new").show();

        console.log(notes_json);
    });
});