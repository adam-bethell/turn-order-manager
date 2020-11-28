function dice_equation_is_valid(equation) {
    equation = equation.toUpperCase();

    // Invalid chars
    if (equation.match(/[^0-9AD +-]/g) != null) {
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

function roll(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function roll_dice(num_dice, max_roll, modifier) {
    let rolls = []
    for (let d = 0; d < num_dice; d++) {
        let discarded = null;
        let kept = null;
        if (modifier != "") {
            let roll_1 = roll(max_roll);
            let roll_2 = roll(max_roll);
            if ((modifier == "A" && roll_1 > roll_2) || (modifier == "D" && roll_1 < roll_2)) {
                let temp = roll_2;
                roll_2 = roll_1;
                roll_1 = temp;
            }
            discarded = roll_1;
            kept = roll_2;
        }
        else {
            kept = roll(max_roll);
        }
        rolls.push({
            "discarded": discarded,
            "kept": kept,
        });
    }
    return rolls;
}

function dice_equation_parse(equation) {
    equation = equation.toUpperCase();
    equation = equation.replace(/ +/g, "");
    let components = equation.split(/([+-])/g);
    if (components[0] == "") {
        components.shift();
    }

    if (components[0] != "+" && components[0] != "-") {
        components.unshift("+");
    }
    
    let parsed_components = [];
    for (let i = 0; i < components.length; i+=2) {
        let operation = components[i]
        let component = components[i+1];

        if (operation != "+" && operation != "-") {
            throw new Error("Invalid operation used: " + operation);
        }

        let parsed_component = {};

        let dice = component.match(/^([0-9]+)([AD]?)[D]([0-9]+)$/);
        let literal = component.match(/^([0-9]+)$/)
        if (dice != null) {
            let num_dice = parseInt(dice[1]);
            let max_roll = parseInt(dice[3]);
            let modifier = dice[2];
            let rolls = roll_dice(num_dice, max_roll, modifier);
            let result = 0;
            for (let j = 0; j < rolls.length; j++) {
                result += rolls[j]["kept"];
            }
            if (operation == "-") {
                result *= -1;
            }

            parsed_component = {
                "type": "dice",
                "operation": operation,
                "result": result,
                "num_dice": num_dice,
                "max_roll": max_roll,
                "modifier": modifier,
                "rolls": rolls,
            };
        }
        else if (literal != null) {
            parsed_component = {
                "type": "literal",
                "operation": operation,
                "result": literal[1],
            };
        }
        else {
            throw new Error('Component is neither dice or literal');
        }

        parsed_components.push(parsed_component);
    }

    let sum = 0;
    for (let i = 0; i < parsed_components.length; i++) {
        sum += parseInt(parsed_components[i]["result"]);
    }

    let parsed_equation = {
        "components": parsed_components,
        "result": sum,
    }
    return parsed_equation;
}

//$(function() {
    $("#dice_submit").on("click", () => {
        let equation = $("#dice_input").val();
        if (!dice_equation_is_valid(equation)) {
            $("#dice_output").empty();
            $("#dice_output").append("invalid input");
        }
        else {
            let parsed_equation = dice_equation_parse(equation);
            let $equation = dice_parsed_equation_html(parsed_equation);
            $("#dice_output").empty();
            $("#dice_output").append($equation);
        }
    });

    function dice_parsed_equation_html(parsed_equation) {
        console.log(parsed_equation);
        let $equation = $("<span>");

        for (let i = 0; i < parsed_equation["components"].length; i++) {0
            let component = parsed_equation["components"][i];

            if (component["type"] == "dice") {
                let rolls = component["rolls"];
                let max_roll = component["max_roll"];
                let $roll = $("<span>");
                let $rolls = []
                for (let j = 0; j < rolls.length; j++) {
                    let roll = rolls[j];
                    if (roll["discarded"] != null) {
                        let $discard = $("<span>").addClass("dice_discard").text(roll["discarded"]);
                        if (roll["discarded"] == 1) {
                            $discard.addClass("dice_botch");
                        }
                        else if (roll["discarded"] == max_roll) {
                            $discard.addClass("dice_crit");
                        }
                        $rolls.push($discard);
                    }

                    let $kept = $("<span>").text(roll["kept"]);
                    if (roll["kept"] == 1) {
                        $kept.addClass("dice_botch");
                    }
                    else if (roll["kept"] == max_roll) {
                        $kept.addClass("dice_crit");
                    }
                    $rolls.push($kept);

                    if (j != rolls.length-1) {
                        $rolls.push(" + ");
                    }
                }
                
                if (i != 0 || component["operation"] == "-") {
                    $roll.append(" " + component["operation"]);
                }

                $roll.append(" (");
                $roll.append($rolls);
                $roll.append(")");

                $equation.append($roll);
            }
            else {
                if (i != 0 || component["operation"] == "-") {
                    $equation.append(" " + component["operation"]);
                }
                $equation.append(" " + component["result"]);
            }
        }

        $equation.append(" = " + parsed_equation["result"].toString());
        return $equation;
    }
//});
