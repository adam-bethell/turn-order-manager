$(function() {
    $("#dice_submit").on("click", function() {
        let equation = $("#dice_input").val().toUpperCase();
        console.log(equation);
        if (!dice_equation_is_valid(equation)) {
            $("#dice_output").empty();
            $("#dice_output").append("invalid input");
        }
        else {
            let clac = parse_dice_equation(equation);
            $("#dice_output").empty();
            $("#dice_output").append(clac);
        }
    });

    function dice_equation_is_valid(equation) {
        // Invalid chars
        if (equation.match(/[^0-9()AD +-]/g) != null) {
            return false;
        }

        // Empty brackets
        if (equation.match(/\( *\)/g) != null) {
            return false;
        }

        // Functions
        if (equation.match(/[^ (+-] *\(/g) != null) {
            return false;
        }

        // Unbalanaced brackets
        let num_left = (equation.match(/\(/g) || []).length;
        let num_right = (equation.match(/\)/g) || []).length;
        if (num_left != num_right) {
            return false;
        }

        // + and - must have right hand components
        if (equation.match(/[+-] *$/g) != null) {
            return false;
        }

        // Invalid dice syntax
        let equation_copy = equation.replace(/([0-9]+)([AD]?)[D]([0-9]+)/g, "");
        if (equation_copy.match(/[AD]/g) != null) {
            return false;
        }

        return true
    }

    function parse_dice_equation(equation) {
        let rolled_matches = [];

        // Roll dice
        let dice_matches = equation.matchAll(/([0-9]+)([AD]?)[D]([0-9]+)/g);
        let dice_match = dice_matches.next();
        while (!dice_match.done) {
            let match = dice_match.value;
            match["num_dice"] = match[1];
            match["mod"] = match[2];
            console.log(match["mod"]);
            match["max"] = match[3];
            let rolls = roll_dice(match);
            match["rolls"] = rolls;
            rolled_matches.push(match);
            dice_match = dice_matches.next();
        }

        // Replace text
        let equation_html = equation;

        for (let i = 0; i < rolled_matches.length; i++) {
            let match = rolled_matches[i];
            equation = equation.replace(match[0], rolled_match_to_sum(match));
            equation_html = equation_html.replace(match[0], rolled_match_to_html(match));
        }
        let result = eval_equation(equation);

        equation_html += " = " + result.toString();

        return equation_html;
    }

    function roll_dice(dice) {
        let o = []
        let max = dice["max"];
        for (let d = 0; d < dice["num_dice"]; d++) {
            if (dice["mod"] != "") {
                o.push(roll(max).toString());
            }
            o.push(roll(max).toString());
        }
        return o;
    }

    function roll(max) {
        return Math.floor(Math.random() * Math.floor(max)) + 1;
    }

    function eval_equation(equation) {
        console.log(equation);
        equation = equation.replace(/[^0-9()+-]/g, "");
        console.log(equation);
        let theInstructions = "return " + equation;
        let F = new Function (theInstructions);
        let result = F();

        return result;
    }

    function rolled_match_to_sum(match) {
        let out = [];
        let max = match["max"];

        for (let i = 0; i < match["rolls"].length; i++) {
            let roll = match["rolls"][i];
            console.log(roll);
            if (match["mod"] != "") {
                console.log("this is a mod roll");
                i++;
                let mod_roll = match["rolls"][i];
                console.log(mod_roll);
                if (match["mod"] == "A" && parseInt(mod_roll) > parseInt(roll)) {
                    console.log("A: " + mod_roll + " > " + roll);
                    roll = mod_roll;
                }
                else if (match["mod"] == "D" && parseInt(mod_roll) < parseInt(roll)) {
                    roll = mod_roll;
                }
            }
            out.push(roll.toString());
        }
        return "(" + out.join(" + ") + ")";
    }

    function rolled_match_to_html(match) {
        let out = [];
        let max = match["max"];

        for (let i = 0; i < match["rolls"].length; i++) {
            let roll = match["rolls"][i];
            let $html = $("<span>");
            if (match["mod"] != "") {
                i++;
                let mod_roll = match["rolls"][i];
                if (match["mod"] == "A" && parseInt(mod_roll) > parseInt(roll)) {
                    let temp = roll;
                    roll = mod_roll;
                    mod_roll = temp;
                }
                else if (match["mod"] == "D" && parseInt(mod_roll) < parseInt(roll)) {
                    let temp = roll;
                    roll = mod_roll;
                    mod_roll = temp;
                }

                let $discard = $("<span>").addClass("dice_discard").text(mod_roll);
                if (mod_roll == max) {
                    $discard.addClass("dice_crit");
                }
                else if (mod_roll == 1) {
                    $discard.addClass("dice_botch");
                }
                $html.append($discard);
            }

            let $roll = $("<span>").text(roll);
            if (roll == max) {
                $roll.addClass("dice_crit");
            }
            else if (roll == 1) {
                $roll.addClass("dice_botch");
            }
            $html.append($roll);

            out.push($html.prop("outerHTML"));
        }
        return "(" + out.join(" + ") + ")";
    }
});
