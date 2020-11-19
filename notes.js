const md = require('markdown-it')();
const { ipcRenderer } = require('electron')
ipcRenderer.on('open_file', function(event, json) {
    console.log(json);
    let note = json["note"];
    console.log(note);
    $("#notes_text").val(note);
});

ipcRenderer.on('save_file', function(event, json) { 
    json["note"] = $("#notes_text").val();
    event.sender.send("json_updated", json);
});

$(function() {
    populate_notes_filename_select();

    $("#notes_render_text").prop("disabled", true);
    $("#notes_markdown").hide();

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

    function populate_notes_filename_select() {
        $select = $("#notes_filename_select");
        $select.empty();

        let options = ["Norwich", "Treasures", "ideas", "Testing", "fun quotes"];
        for (let i = 0; i < options.length; i++) {
            let $option = $("<option>").val(options[i] + ".md").text(options[i]);
            $select.append($option);
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
            console.log(result.toString() + " == " + row_value.toString());
            if (row_value == result) {
                $(this).addClass("highlight");
            }
            else {
                $(this).removeClass("highlight");
            }
        });
    });
});