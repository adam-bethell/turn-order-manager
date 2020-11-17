let md = require('markdown-it')();

$(function() {
    $("#notes_render_text").prop("disabled", true);
    $("#notes_markdown").hide();

    $("#notes_render_markdown").on("click", function() {
        $("#notes_render_markdown").prop("disabled", true);
        $("#notes_render_text").prop("disabled", false);
        $("#notes_markdown").show();
        $("#notes_text").hide();

        let text = $("#notes_text").val();
        let markdown = md.render(text);
        $("#notes_markdown").empty();
        $("#notes_markdown").append(markdown);
    });

    $("#notes_render_text").on("click", function() {
        $("#notes_render_markdown").prop("disabled", false);
        $("#notes_render_text").prop("disabled", true);
        $("#notes_markdown").hide();
        $("#notes_text").show();
    });
});