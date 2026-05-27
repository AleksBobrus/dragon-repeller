// =============================================
//  DRAGON REPELLER – ОСНОВНОЙ КОД ИГРЫ
//  (рефакторинг с единым состоянием и модулями)
// =============================================

// ----- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ИГРЫ -----
// Теперь все характеристики хранятся в одном объекте.
// Это упрощает сброс, сохранение и отладку.

const gameState = {
    xp: 0,
    health: 100,
    gold: 50,
    currentWeaponIndex: 0,
    inventory: ["stick"],
    fighting: null,          // индекс монстра в массиве monsters или null
    monsterHealth: 0
};

// ----- КОНСТАНТЫ (оружие, монстры, локации) -----
const weapons = [
    { name: "stick", power: 5 },
    { name: "dagger", power: 30 },
    { name: "claw hammer", power: 50 },
    { name: "sword", power: 100 }
];

const monsters = [
    { name: "slime", level: 2, health: 15 },
    { name: "fanged beast", level: 8, health: 60 },
    { name: "dragon", level: 20, health: 300 }
];

// Локации – центральная конфигурация игры.
// Каждая локация задаёт текст кнопок, их действия и описание.
const locations = [
    {
        name: "town square",
        buttonText: ["Go to store", "Go to cave", "Fight dragon"],
        buttonFunctions: [goStore, goCave, fightDragon],
        text: 'You are in the town square. You see a sign that says "Store".'
    },
    {
        name: "store",
        buttonText: ["Buy 10 health (10 gold)", "Buy weapon (30 gold)", "Go to town square"],
        buttonFunctions: [buyHealth, buyWeapon, goTown],
        text: "You enter the store."
    },
    {
        name: "cave",
        buttonText: ["Fight slime", "Fight fanged beast", "Go to town square"],
        buttonFunctions: [fightSlime, fightBeast, goTown],
        text: "You enter the cave. You see some monsters."
    },
    {
        name: "fight",
        buttonText: ["Attack", "Dodge", "Run"],
        buttonFunctions: [attack, dodge, goTown],
        text: "You are fighting a monster."
    },
    {
        name: "kill monster",
        buttonText: ["Go to town square", "Go to town square", "Go to town square"],
        buttonFunctions: [goTown, goTown, easterEgg],
        text: 'The monster screams "Arg!" as it dies. You gain experience points and find gold.'
    },
    {
        name: "lose",
        buttonText: ["REPLAY?", "REPLAY?", "REPLAY?"],
        buttonFunctions: [restart, restart, restart],
        text: "You die. ☠️"
    },
    {
        name: "win",
        buttonText: ["REPLAY?", "REPLAY?", "REPLAY?"],
        buttonFunctions: [restart, restart, restart],
        text: "You defeat the dragon! YOU WIN THE GAME! 🎉"
    },
    {
        name: "easter egg",
        buttonText: ["2", "8", "Go to town square?"],
        buttonFunctions: [pickTwo, pickEight, goTown],
        text: "You find a secret game. Pick a number above. Ten numbers will be randomly chosen between 0 and 10. If the number you choose matches one of the random numbers, you win!"
    }
];

// ----- DOM-ЭЛЕМЕНТЫ (получаем один раз для производительности) -----
const button1 = document.querySelector("#button1");
const button2 = document.querySelector("#button2");
const button3 = document.querySelector("#button3");
const text = document.querySelector("#text");
const xpText = document.querySelector("#xpText");
const healthText = document.querySelector("#healthText");
const goldText = document.querySelector("#goldText");
const monsterStats = document.querySelector("#monsterStats");
const monsterName = document.querySelector("#monsterName");
const monsterHealthText = document.querySelector("#monsterHealth");

// Инициализация кнопок главного экрана
button1.onclick = goStore;
button2.onclick = goCave;
button3.onclick = fightDragon;

// ----- ОСНОВНЫЕ ФУНКЦИИ ПЕРЕХОДОВ МЕЖДУ ЛОКАЦИЯМИ -----
function goTown() {
    update(locations[0]);
}

function goStore() {
    update(locations[1]);
}

function goCave() {
    update(locations[2]);
}

function fightSlime() {
    gameState.fighting = 0;
    goFight();
}

function fightBeast() {
    gameState.fighting = 1;
    goFight();
}

function fightDragon() {
    gameState.fighting = 2;
    goFight();
}

// ----- УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА -----
// Принимает объект локации и перерисовывает кнопки, текст, скрывает монстра (если не бой).
function update(location) {
    // Скрываем панель монстра по умолчанию (покажется только в бою)
    monsterStats.style.display = "none";

    // Обновляем кнопки и их действия из конфигурации локации
    button1.innerText = location.buttonText[0];
    button2.innerText = location.buttonText[1];
    button3.innerText = location.buttonText[2];
    button1.onclick = location.buttonFunctions[0];
    button2.onclick = location.buttonFunctions[1];
    button3.onclick = location.buttonFunctions[2];
    text.innerHTML = location.text;
}

// ----- ФУНКЦИИ МАГАЗИНА -----
function buyHealth() {
    if (gameState.gold >= 10) {
        gameState.gold -= 10;
        gameState.health += 10;
        refreshStatsDisplay();
        text.innerText = "You bought 10 health.";
    } else {
        text.innerText = "You do not have enough gold to buy health.";
    }
}

function buyWeapon() {
    if (gameState.currentWeaponIndex < weapons.length - 1) {
        if (gameState.gold >= 30) {
            gameState.gold -= 30;
            gameState.currentWeaponIndex++;
            const newWeapon = weapons[gameState.currentWeaponIndex].name;
            gameState.inventory.push(newWeapon);
            refreshStatsDisplay();
            text.innerText = `You now have a ${newWeapon}. In your inventory: ${gameState.inventory.join(", ")}`;
        } else {
            text.innerText = "You do not have enough gold to buy a weapon.";
        }
    } else {
        // Уже самое мощное оружие – предлагаем продать
        text.innerText = "You already have the most powerful weapon!";
        button2.innerText = "Sell weapon for 15 gold";
        button2.onclick = sellWeapon;
    }
}

function sellWeapon() {
    if (gameState.inventory.length > 1) {
        gameState.gold += 15;
        const soldWeapon = gameState.inventory.shift();
        gameState.currentWeaponIndex = Math.max(0, gameState.currentWeaponIndex - 1);
        refreshStatsDisplay();
        text.innerText = `You sold a ${soldWeapon}. In your inventory: ${gameState.inventory.join(", ")}`;
    } else {
        text.innerText = "Don't sell your only weapon!";
    }
}

// ----- БОЕВАЯ СИСТЕМА -----
function goFight() {
    update(locations[3]); // локация "fight"
    gameState.monsterHealth = monsters[gameState.fighting].health;
    monsterStats.style.display = "block";
    monsterName.innerText = monsters[gameState.fighting].name;
    monsterHealthText.innerText = gameState.monsterHealth;
}

function attack() {
    const monster = monsters[gameState.fighting];
    // Атака монстра
    const monsterDamage = getMonsterAttackValue(monster.level);
    gameState.health -= monsterDamage;
    // Атака игрока (если попадёт)
    if (isMonsterHit()) {
        const playerDamage = weapons[gameState.currentWeaponIndex].power + Math.floor(Math.random() * gameState.xp) + 1;
        gameState.monsterHealth -= playerDamage;
        text.innerText = `You strike the ${monster.name} for ${playerDamage} damage.`;
    } else {
        text.innerText = "You miss!";
    }
    text.innerText += ` The ${monster.name} attacks you for ${monsterDamage} damage.`;
    // Обновляем отображение здоровья
    healthText.innerText = gameState.health;
    monsterHealthText.innerText = gameState.monsterHealth;
    // Проверка окончания боя
    if (gameState.health <= 0) {
        lose();
    } else if (gameState.monsterHealth <= 0) {
        if (gameState.fighting === 2) {
            winGame();
        } else {
            defeatMonster();
        }
    }
    // Шанс поломки оружия (кроме последнего)
    if (Math.random() <= 0.1 && gameState.inventory.length > 1) {
        const broken = gameState.inventory.pop();
        gameState.currentWeaponIndex = Math.max(0, gameState.currentWeaponIndex - 1);
        text.innerText += ` Your ${broken} breaks.`;
    }
}

function dodge() {
    text.innerText = `You dodge the attack from the ${monsters[gameState.fighting].name}.`;
}

function getMonsterAttackValue(level) {
    const hit = level * 5 - Math.floor(Math.random() * gameState.xp);
    return hit > 0 ? hit : 0;
}

function isMonsterHit() {
    // Игрок попадает с вероятностью 80%, или всегда если здоровье < 20
    return Math.random() > 0.2 || gameState.health < 20;
}

function defeatMonster() {
    const monster = monsters[gameState.fighting];
    gameState.gold += Math.floor(monster.level * 6.7);
    gameState.xp += monster.level;
    refreshStatsDisplay();
    update(locations[4]); // "kill monster"
}

function lose() {
    update(locations[5]); // "lose"
}

function winGame() {
    update(locations[6]); // "win"
}

// ----- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ -----
function refreshStatsDisplay() {
    xpText.innerText = gameState.xp;
    healthText.innerText = gameState.health;
    goldText.innerText = gameState.gold;
}

function restart() {
    gameState.xp = 0;
    gameState.health = 100;
    gameState.gold = 50;
    gameState.currentWeaponIndex = 0;
    gameState.inventory = ["stick"];
    gameState.fighting = null;
    gameState.monsterHealth = 0;
    refreshStatsDisplay();
    goTown();
}

// ----- ПАСХАЛЬНОЕ ЯЙЦО -----
function easterEgg() {
    update(locations[7]);
}

function pick(guess) {
    const numbers = [];
    while (numbers.length < 10) {
        numbers.push(Math.floor(Math.random() * 11));
    }
    text.innerText = `You picked ${guess}. Here are the random numbers:\n${numbers.join("\n")}\n`;
    if (numbers.includes(guess)) {
        text.innerText += "Right! You win 20 gold!";
        gameState.gold += 20;
    } else {
        text.innerText += "Wrong! You lose 10 health!";
        gameState.health -= 10;
        if (gameState.health <= 0) {
            lose();
            return;
        }
    }
    refreshStatsDisplay();
}

function pickTwo() {
    pick(2);
}

function pickEight() {
    pick(8);
}
