let last_game = null;

function regular_up(table, obstacle, table_size) {
    for (let i = 0; i < table_size; i++) {
        let offset = 0;
        for (let j = 0; j < table_size; j++) {
            if (obstacle[i][j]) {
                for (let k = 0; k < offset; k++) table[i][j - k - 1] = 0;
                offset = 0;
            } else if (table[i][j] === 0) offset++;
            else table[i][j - offset] = table[i][j];
        }
        for (let j = 0; j < offset; j++) table[i][table_size - 1 - j] = 0;
    }
}

function regular_down(table, obstacle, table_size) {
    for (let i = 0; i < table_size; i++) {
        let offset = 0;
        for (let j = table_size - 1; j >= 0; j--) {
            if (obstacle[i][j]) {
                for (let k = 0; k < offset; k++) table[i][j + k + 1] = 0;
                offset = 0;
            } else if (table[i][j] === 0) offset++;
            else table[i][j + offset] = table[i][j];
        }
        for (let j = 0; j < offset; j++) table[i][j] = 0;
    }
}

function regular_left(table, obstacle, table_size) {
    for (let j = 0; j < table_size; j++) {
        let offset = 0;
        for (let i = 0; i < table_size; i++) {
            if (obstacle[i][j]) {
                for (let k = 0; k < offset; k++) table[i - k - 1][j] = 0;
                offset = 0;
            } else if (table[i][j] === 0) offset++;
            else table[i - offset][j] = table[i][j];
        }
        for (let i = 0; i < offset; i++) table[table_size - 1 - i][j] = 0;
    }
}

function regular_right(table, obstacle, table_size) {
    for (let j = 0; j < table_size; j++) {
        let offset = 0;
        for (let i = table_size - 1; i >= 0; i--) {
            if (obstacle[i][j]) {
                for (let k = 0; k < offset; k++) table[i + k + 1][j] = 0;
                offset = 0;
            } else if (table[i][j] === 0) offset++;
            else table[i + offset][j] = table[i][j];
        }
        for (let i = 0; i < offset; i++) table[i][j] = 0;
    }
}

function combination_up(table, obstacle, table_size) {
    for (let i = 0; i < table_size; i++) {
        for (let j = 1; j < table_size; j++) {
            if (obstacle[i][j] || obstacle[i][j - 1]) continue;
            if (table[i][j] === table[i][j - 1] && table[i][j] !== 0) {
                table[i][j] = 0;
                table[i][j - 1] = table[i][j - 1] + 1;
            }
        }
    }
}

function combination_down(table, obstacle, table_size) {
    for (let i = 0; i < table_size; i++) {
        for (let j = table_size - 2; j >= 0; j--) {
            if (obstacle[i][j] || obstacle[i][j + 1]) continue;
            if (table[i][j] === table[i][j + 1] && table[i][j] !== 0) {
                table[i][j] = 0;
                table[i][j + 1] = table[i][j + 1] + 1;
            }
        }
    }
}

function combination_left(table, obstacle, table_size) {
    for (let j = 0; j < table_size; j++) {
        for (let i = 1; i < table_size; i++) {
            if (obstacle[i][j] || obstacle[i - 1][j]) continue;
            if (table[i][j] === table[i - 1][j] && table[i][j] !== 0) {
                table[i][j] = 0;
                table[i - 1][j] = table[i - 1][j] + 1;
            }
        }
    }
}

function combination_right(table, obstacle, table_size) {
    for (let j = 0; j < table_size; j++) {
        for (let i = table_size - 2; i >= 0; i--) {
            if (obstacle[i][j] || obstacle[i + 1][j]) continue;
            if (table[i][j] === table[i + 1][j] && table[i][j] !== 0) {
                table[i][j] = 0;
                table[i + 1][j] = table[i + 1][j] + 1;
            }
        }
    }
}

function moves_up(table, obstacle, table_size, maximum_generate, level) {
    last_game = [];
    for (let i = 0; i < table_size; i++) {
        last_game.push([]);
        for (let j = 0; j < table_size; j++) {
            last_game[i].push(table[i][j]);
        }
    }
    regular_up(table, obstacle, table_size);
    combination_up(table, obstacle, table_size);
    regular_up(table, obstacle, table_size);
    for (let i = 0; i < (2 + 2 * level); i++) generate_new(table, obstacle, table_size, maximum_generate);
}

function moves_down(table, obstacle, table_size, maximum_generate, level) {
    last_game = [];
    for (let i = 0; i < table_size; i++) {
        last_game.push([]);
        for (let j = 0; j < table_size; j++) {
            last_game[i].push(table[i][j]);
        }
    }
    regular_down(table, obstacle, table_size);
    combination_down(table, obstacle, table_size);
    regular_down(table, obstacle, table_size);
    for (let i = 0; i < (2 + 2 * level); i++) generate_new(table, obstacle, table_size, maximum_generate);
}

function moves_left(table, obstacle, table_size, maximum_generate, level) {
    last_game = [];
    for (let i = 0; i < table_size; i++) {
        last_game.push([]);
        for (let j = 0; j < table_size; j++) {
            last_game[i].push(table[i][j]);
        }
    }
    regular_left(table, obstacle, table_size);
    combination_left(table, obstacle, table_size);
    regular_left(table, obstacle, table_size);
    for (let i = 0; i < (2 + 2 * level); i++) generate_new(table, obstacle, table_size, maximum_generate);
}

function moves_right(table, obstacle, table_size, maximum_generate, level) {
    last_game = [];
    for (let i = 0; i < table_size; i++) {
        last_game.push([]);
        for (let j = 0; j < table_size; j++) {
            last_game[i].push(table[i][j]);
        }
    }
    regular_right(table, obstacle, table_size);
    combination_right(table, obstacle, table_size);
    regular_right(table, obstacle, table_size);
    for (let i = 0; i < (2 + 2 * level); i++) generate_new(table, obstacle, table_size, maximum_generate);
}

function can_move_left(table, obstacle, table_size) {
    last_game = [];
    for (let i = 0; i < table_size; i++) {
        last_game.push([]);
        for (let j = 0; j < table_size; j++) {
            last_game[i].push(table[i][j]);
        }
    }
    let can = false;
    for (let j = 0; j < table_size; j++) {
        for (let i = 1; i < table_size; i++) {
            if (obstacle[i - 1][j] || obstacle[i][j]) continue;
            if (table[i - 1][j] === 0 && table[i][j] !== 0) {
                can = true;
            } else if (table[i - 1][j] === table[i][j] && table[i][j]) {
                can = true;
            }
        }
    }
    return can;
}

function can_move_right(table, obstacle, table_size) {
    let can = false;
    for (let j = 0; j < table_size; j++) {
        for (let i = 1; i < table_size; i++) {
            if (obstacle[i - 1][j] || obstacle[i][j]) continue;
            if (table[i - 1][j] && !table[i][j]) {
                can = true;
            } else if (table[i - 1][j] === table[i][j] && table[i][j]) {
                can = true;
            }
        }
    }
    return can;
}

function can_move_up(table, obstacle, table_size) {
    let can = false;
    for (let i = 0; i < table_size; i++) {
        for (let j = 1; j < table_size; j++) {
            if (obstacle[i][j - 1] || obstacle[i][j]) continue;
            if (table[i][j] && !table[i][j - 1]) {
                can = true;
            } else if (table[i][j] === table[i][j - 1] && table[i][j]) {
                can = true;
            }
        }
    }
    return can;
}

function can_move_down(table, obstacle, table_size) {
    let can = false;
    for (let i = 0; i < table_size; i++) {
        for (let j = 1; j < table_size; j++) {
            if (obstacle[i][j - 1] || obstacle[i][j]) continue;
            if (table[i][j - 1] && !table[i][j]) {
                can = true;
            } else if (table[i][j] === table[i][j - 1] && table[i][j]) {
                can = true;
            }
        }
    }
    return can;
}

function rand(max) {
    return Math.floor(Math.random() * max);
}

function generate_new(table, obstacle, table_size, maximum_generate) {
    let blanks = 0;
    for (let j = 0; j < table_size; j++) {
        for (let i = 0; i < table_size; i++) {
            if (table[i][j] === 0) blanks++;
        }
    }

    if (!blanks) return;

    let fill = rand(blanks);
    blanks = 0;

    for (let j = 0; j < table_size; j++) {
        for (let i = 0; i < table_size; i++) {
            if (!table[i][j] && blanks === fill) {
                table[i][j] = 1 + Math.floor(Math.random() * maximum_generate);
                blanks++;
            } else if (!table[i][j]) {
                blanks++;
            }
        }
    }
}

function win(table, obstacle, table_size, level) {
    for (let i = 0; i < table_size; i++) {
        for (let j = 0; j < table_size; j++) {
            if (level === false && table[i][j] >= 5) return true;
            else if (level === true && table[i][j] >= 11) return true;
        }
    }
    return false;
}

function dead(table, obstacle, table_size) {
    return !can_move_down(table, obstacle, table_size) &&
        !can_move_up(table, obstacle, table_size) &&
        !can_move_left(table, obstacle, table_size) &&
        !can_move_right(table, obstacle, table_size);
}

function perform_deobstacle(obstacle, i, j) {
    if (obstacle[i][j]) {
        obstacle[i][j] = 0;
        last_game = null;
        return true;
    }
    return false;
}

function perform_obstacle(table, obstacle, i, j) {
    if (obstacle[i][j] || table[i][j] === 0) return false;
    obstacle[i][j] = true;
    last_game = null;
    return true;
}

function perform_undo(table, table_size) {
    if (last_game === null) return false;
    for (let i = 0; i < table_size; i++) {
        for (let j = 0; j < table_size; j++) {
            game[i][j] = last_game[i][j];
        }
    }
    last_game = null;
    return true;
}

function enable_obstacle(table, table_size) {
    for (let i = 0; i < table_size; i++) {
        for (let j = 0; j < table_size; j++) {
            if (table[i][j] >= 7) return true;
        }
    }
    return false;
}