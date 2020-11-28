//$(() => {
    const notes_menu_template = [
        {
            label: "Rename",
            click: notes_browser_context_menu_callback_rename,
        },
        { type: 'separator' },
        {
            label: "Delete",
            click: notes_browser_context_menu_callback_delete,
        },
    ]
    const notes_menu = Menu.buildFromTemplate(notes_menu_template);

    let notes_json = [{
        "title": "New Note",
        "body": get_default_note_body(),
    }];
    let current_note = "New Note";

    function get_default_note_body() {
        let text = "# New Note\nThis is a note!\n__bold__ **bold** _italics_ *italics*\n\n";
        text += "1d4 | Item\n----|-----\n1   | Apple\n2   | Banana\n3   | Pear\n4   | Gold!\n\n";
        text += " - Item 1\n - Item 2\n - Item 3";
        return text;
    }

    function get_note_index_for_title(title) {
        for (let i = 0; i < notes_json.length; i++) {
            if (notes_json[i]["title"] == title) {
                return i;
            }
        }
        return -1;
    }

    function save_current_note_editor_to_json() {
        let index = get_note_index_for_title(current_note);
        if (index != -1) {
            notes_json[index]["body"] = $("#notes_text").val();
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

    function populate_notes_table() {
        $tbody = $("#notes_browser tbody");
        $tbody.empty();

        let notes = [];
        if (notes_json != null && notes_json.length > 0) {
            for (let i = 0; i < notes_json.length; i++) {
                notes.push(notes_json[i]["title"]);
            }
        }

        for (let i = 0; i < notes.length; i++) {
            let $tr = $("<tr>").addClass("note_label").append($("<td>").text(notes[i])).append("<td>");
            if (notes[i] == current_note) {
                $tr.addClass("highlight")
            }
            $tbody.append($tr);
        }
    }

    function open_note(title) {
        let index = get_note_index_for_title(title);
        if (index == -1) {
            return;
        }
        current_note = title;
        populate_notes_table();
        let text = notes_json[index]["body"];
        $("#notes_text").val(text);
        $("#notes_markdown").empty();
        $("#notes_markdown").append(render_tom_markdown(text));
    }

    function set_notes_json(json) {
        notes_json = json;
        console.log(notes_json)
        if (notes_json.length == 0) {
            notes_json = [{
                "title": "New Note",
                "body": get_default_note_body(),
            }];
            current_note = "New Note";
        }

        open_note(notes_json[0]["title"]);
        populate_notes_table();
    }

    function get_notes_json() {
        save_current_note_editor_to_json();
        return notes_json;
    }

    function show_notes_editor() {
        $("#notes_render_markdown").prop("disabled", false);
        $("#notes_render_text").prop("disabled", true);
        $("#notes_markdown").hide();
        $("#notes_text").show();
    }

    function show_notes_markdown() {
        $("#notes_render_markdown").prop("disabled", true);
        $("#notes_render_text").prop("disabled", false);
        $("#notes_markdown").show();
        $("#notes_text").hide();

        let text = $("#notes_text").val();
        $("#notes_markdown").empty();
        $("#notes_markdown").append(render_tom_markdown(text));
    }

    $("#notes_render_markdown").on("click", show_notes_markdown);

    $("#notes_render_text").on("click", show_notes_editor);

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
        let $td = $(this).children().first();
        if ($td.find("input").length > 0) {
            return;
        }

        save_current_note_editor_to_json();
        let title = $td.text();
        open_note(title);
        populate_notes_table();
    });

    let notes_browser_context_menu_target = null;
    $("#notes_browser").on("contextmenu", "tbody tr", function() {
        let title = $(this).children().first().text();
        notes_browser_context_menu_target = title;
        notes_menu.popup();
    });
    
    function notes_browser_context_menu_callback_delete() {
        save_current_note_editor_to_json();
        let index = get_note_index_for_title(notes_browser_context_menu_target);
        notes_browser_context_menu_target = null;
        notes_json.splice(index, 1);

        if (notes_json.length == 0) {
            notes_json = [{
                "title": "New Note",
                "body": "",
            }];
        }

        open_note(notes_json[0]["title"]);
    }

    function notes_browser_context_menu_callback_rename() {
        let title = notes_browser_context_menu_target;

        $("#notes_browser tbody tr").each(function() {
            $(this).removeClass("note_label");
            let $td = $(this).children().first();
            let this_title = $td.text();
            if (this_title == title) {
                $td.empty();
                let $input = $("<input>").addClass("rename_note_input").val(title);
                $td.append($input);
                $input.trigger("focus")
                return;
            }
        });
    }

    $("#notes_new").on("click", () => {
        $("#notes_new").hide();
        let $input = $("<input>").addClass("new_note_input");
        let $new_note_input = $("<tr>").append($("<td>").append($input)).append($("<td>"));
        $("#notes_browser thead").append($new_note_input);
        $input.trigger("focus")
    });

    $("#notes_browser").on("focusout", ".new_note_input", function() {
        let new_note_name = $(this).val();
        new_note_name = new_note_name.trim();
        if (new_note_name != "") {
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

            save_current_note_editor_to_json();
            open_note(new_note_name);
            show_notes_editor();
            populate_notes_table(new_note_name);
        }

        $("#notes_browser thead tr").last().remove();
        $("#notes_new").show();
    });

    $("#notes_browser").on("focusout", ".rename_note_input", function() {
        let original_title = notes_browser_context_menu_target;
        let updated_note_name = $(this).val();
        updated_note_name = updated_note_name.trim();
        
        if (updated_note_name == "") {
            updated_note_name = original_title;
        }

        if (original_title != updated_note_name) {
            let found = false;
            do {
                found = false;
                for (let i = 0; i < notes_json.length; i++) {
                    if (notes_json[i]["title"] == updated_note_name) {
                        found = true;
                        updated_note_name += "_";
                    }
                }
            } while(found);

            let index = get_note_index_for_title(original_title);
            notes_json[index]["title"] = updated_note_name;

            if (current_note == original_title) {
                current_note = updated_note_name;
            }
        }
        
        $(this).closest("td").text(updated_note_name);
        $(this).closest("tr").addClass("note_label");
        $(this).remove();

        notes_browser_context_menu_target = null;
    });

    // On Load
    open_note(notes_json[0]["title"]);
    show_notes_markdown();
    populate_notes_table();
//});