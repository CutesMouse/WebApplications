class Hint {
    picture_offset_x = 0;
    picture_offset_y = 0;
    picture_width = 0;
    picture_height = 0;

    press = function() {

    }
}

function pick_new_card_hint(player) {
    let inst = new Hint();
    inst.picture_offset_x = 0;
    inst.picture_offset_y = 0;
    inst.picture_width = 78;
    inst.picture_height = 36;
    inst.press = function() {
        player.pick_new_card();
    }
    return inst;
}

function accept_drawing_hint(player) {
    let inst = new Hint();
    inst.picture_offset_x = 78;
    inst.picture_offset_y = 0;
    inst.picture_width = 126;
    inst.picture_height = 36;
    inst.press = function() {
        player.pick_new_card(); // todo-accepting
    }
    return inst;
}

function color_button(player, card) {

}