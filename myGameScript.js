'use strict';
//paramètres du jeu
const ballSpd = 0.5; // vitesse de la balle comme fraction de la hauteur de l'écran
const maxBallSpd = 2; // multiple de vitesse max de la balle par rapport à la vitesse du début
const ballSpin = 0.2; // effet de la balle 
const espaceBrick = 0.3; //espace entre chaque brique fraction de largeur du mur
const colBrick = 14; // nombre de colomne de briques
const rangBrick = 6; // nombre de rang de briques du jeu
const viesJeu = 3; //  nbre de vies au démaarage du Jeu
const scoreCle = 'highscore'; // enregistre le plus haut score
const marge = 6; //nombre de rang vide au dessus des briques
let niveau = 0;
const niveauMax = 10; //maximum de niveau de jeu (+2 rangs de briques à chaque niveau)
const angleMinRebond = 30; // angle minimum horizontal degrée
const supportW = 0.1; // taille du support fraction de la taille de l'écran
const supportSize = 1.5 // taille du support en fonction de l'epaisseur du mur
const supportSpd = 0.5; // fraction de hauteur de l'ecran par seconde
const pUpSpd = 0.15; //vitesse chance comme fraction de la hauteur de l'écran
const pUpChance = 0.1; //chance obtenue en fonction du nbre de briques touchées (entre 0 et 1)
const pUpBonus = 50; //Points bonus pour la collecte d'un Power Up extra
const mur = 0.02; // mur, ball size fraction de l'écran le plus petit

//couleurs
const couleursBackground = 'black';
const couleursMur = 'grey';
const couleursSupport = 'white';
const couleursBall = 'white';
const couleursText = 'white';

//TEXTES
const textFont = "'Nanum Gothic', sans-serif";
const textStart = "Game start : space bar and play with arrow keys"
const textFin = "Try again !";
const textNiveau = "Level";
const textVies = "Ball";
const textScore = "Score";
const textHighScore = "Best";
const textGagne = "Awesome !!!! ";

//definitions
const Direction = {
    LEFT: 0,
    RIGHT: 1,
    STOP: 2
}

const PUpType = {
    extensionSupport: {
        color: 'dodgerblue',
        symbol: '='
    },
    viePlus: {
        color: 'hotpink',
        symbol: '+'
    },
    stickySupport: {
        color: 'forestgreen',
        symbol: '~'
    },
    superBall: {
        color: 'magenta',
        symbol: 's'
    }
}

//mon Canvas et contexte   
var monCanvas = document.getElementById("myCanvas");
//document.body.appendChild(monCanvas);
var ctx = monCanvas.getContext('2d');

// Effets sonores
var fxBrick = new Audio('sounds/brick.m4a');
var fxSupport = new Audio('sounds/support.m4a');
var fxMur = new Audio('sounds/mur.m4a');
var fxLevelPlus = new Audio('sounds/levelPlus.m4a');

//variables du jeu
var ball, bricks = [],
    support, pUps = [];
var gameStart, gameOver, pUpExtensionSupport, pUpStickySupport, pUpSuperBall, gagne;
var level, vies, score, scoreHigh;
var nbrBricks, textSize, touchX;

//
var height, width, murJeu;
setDimensions();

//event.listerners
monCanvas.addEventListener("touchcancel", touchCancel);
monCanvas.addEventListener("touchend", touchEnd);
monCanvas.addEventListener("touchmove", touchMove);
monCanvas.addEventListener("touchstart", touchStart);
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
window.addEventListener("resize", setDimensions);

// la boucle du jeu
var timeDelta, timeLast;

requestAnimationFrame(loop);

function loop(timeNow) {
    if (!timeLast) {
        timeLast = timeNow;
    }
    // calcul de la différence du temps
    timeDelta = (timeNow - timeLast) / 1000; // seconds
    timeLast = timeNow;

    //update
    if (!gameOver) {
        updateSupport(timeDelta);
        updateBall(timeDelta);
        updateBricks(timeDelta);
        updatePUps(timeDelta);
    }

    //draw
    drawBackground();
    drawWalls();
    drawPUps();
    drawSupport();
    drawBricks();
    drawText();
    drawBall();

    //appel de la prochaine boucle
    requestAnimationFrame(loop);
}

//update la vitesse en X et Y de la balle
function donneVitesseBall(angle) {

    ball.xv = ball.spd * Math.cos(angle);
    ball.yv = -ball.spd * Math.sin(angle);
}

function createBricks() {
    //dimension des rangs
    let minY = murJeu
    let maxY = ball.y - ball.h * 3.5;
    let totalSpaceY = maxY - minY;
    let nbrRangTotal = marge + rangBrick + niveauMax * 2;
    let rangH = totalSpaceY / nbrRangTotal;
    let gap = murJeu * espaceBrick;
    let h = rangH - gap;
    textSize = rangH * marge * 0.5;

    //dimension des colonnes
    let totalSpacex = width - murJeu * 2;
    let colW = (totalSpacex - espaceBrick) / colBrick;
    let w = colW - gap;

    //remplissage du tableau de briques
    bricks = [];
    let cols = colBrick;
    let rang = rangBrick + niveau * 2;
    let color, left, rank, rankHigh, score, spdMult, top;
    nbrBricks = cols * rang;
    rankHigh = rang * 0.5 - 1;
    for (let i = 0; i < rang; i++) {
        bricks[i] = [];
        rank = Math.floor(i * 0.5);
        score = (rankHigh - rank) * 2 + 1; //point par brique en fonction de son rang
        spdMult = 1 + (rankHigh - rank) / rankHigh * (maxBallSpd - 1); //ratio
        color = changeCouleurBrick(rank, rankHigh);
        top = murJeu + (marge + i) * rangH;
        for (let j = 0; j < cols; j++) {
            left = murJeu + gap + j * colW;
            bricks[i][j] = new Brick(left, top, w, h, color, score, spdMult);
        }
    }
}

function drawBackground() {
    ctx.fillStyle = couleursBackground;
    ctx.fillRect(0, 0, monCanvas.width, monCanvas.height);
}

function drawBall() {
    ctx.fillStyle = pUpSuperBall ? PUpType.superBall.color : couleursBall;
    ctx.fillRect(ball.x - ball.w * 0.5, ball.y - ball.h * 0.5, ball.w, ball.h);
}

function drawBricks() {
    for (let rang of bricks) {
        for (let brick of rang) {
            if (brick == null) {
                continue;
            }
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.left, brick.top, brick.w, brick.h);
        }
    }
}

function drawSupport() {
    ctx.fillStyle = pUpStickySupport ? PUpType.stickySupport.color : couleursSupport;
    ctx.fillRect(support.x - support.w * 0.5, support.y - support.h * 0.5, support.w, support.h);
}

function drawPUps() {
    ctx.lineWidth = murJeu * 0.35;
    for (let pUp of pUps) {
        ctx.fillStyle = pUp.type.color;
        ctx.strokeStyle = pUp.type.color;
        ctx.strokeRect(pUp.x - pUp.w * 0.5, pUp.y - pUp.h * 0.5, pUp.w, pUp.h);
        ctx.font = "bold " + pUp.h + "px " + textFont;
        ctx.textAlign = "center";
        ctx.fillText(pUp.type.symbol, pUp.x, pUp.y);
    }
}

function drawText() {
    ctx.fillStyle = couleursText;

    //dimensions
    let labelSize = textSize * 0.5;
    let margin = murJeu * 2;
    let maxWidth = width - margin * 2;
    let maxWidth1 = maxWidth * 0.27;
    let maxWidth2 = maxWidth * 0.2;
    let maxWidth3 = maxWidth * 0.2;
    let maxWidth4 = maxWidth * 0.27;
    let x1 = margin;
    let x2 = width * 0.4;
    let x3 = width * 0.6;
    let x4 = width - margin;
    let yLabel = murJeu + labelSize;
    let yValue = yLabel + textSize * 0.9;

    //labels
    ctx.font = labelSize + 'px ' + textFont;
    ctx.textAlign = 'left';
    ctx.fillText(textScore, x1, yLabel, maxWidth1);
    ctx.textAlign = 'center';
    ctx.fillText(textVies, x2, yLabel, maxWidth2);
    ctx.fillText(textNiveau, x3, yLabel, maxWidth3);
    ctx.textAlign = 'right';
    ctx.fillText(textHighScore, x4, yLabel, maxWidth4);

    //values
    ctx.font = textSize + 'px ' + textFont;
    ctx.textAlign = 'left';
    ctx.fillText(score, x1, yValue, maxWidth1);
    ctx.textAlign = 'center';
    ctx.fillText(vies + '/' + viesJeu, x2, yValue, maxWidth2);
    ctx.fillText(niveau, x3, yValue, maxWidth3);
    ctx.textAlign = 'right';
    ctx.fillText(scoreHigh, x4, yValue, maxWidth4);

    //Game Start
    if (gameStart) {
        ctx.textBaseline = "middle";
        ctx.font = textSize + 'px ' + textFont;
        ctx.textAlign = 'center';
        ctx.fillText(textStart, width / 2, support.y - textSize * 4, maxWidth);
    }
    //game Over
    if (gameOver) {
        let text = gagne ? textGagne : textFin;
        ctx.font = textSize + 'px ' + textFont;
        ctx.textAlign = 'center';
        ctx.fillText(text, width / 2, support.y - textSize * 4, maxWidth);
        gameStart = false;
    }
}

function drawWalls() {
    let hMur = murJeu * 0.5;
    ctx.lineWidth = murJeu;
    ctx.strokeStyle = couleursMur;
    ctx.beginPath();
    ctx.moveTo(hMur, height);
    ctx.lineTo(hMur, hMur);
    ctx.lineTo(width - hMur, hMur);
    ctx.lineTo(width - hMur, height);
    ctx.stroke();
}

//red = 0; orange = 0.33, yellwo = 067, green = 
function changeCouleurBrick(rank, highestRank) {
    let fraction = rank / highestRank;
    let r, g, b = 0;
    // red à orange à jaune (increase green)
    if (fraction <= 0.67) {
        r = 255;
        g = 255 * fraction / 0.67
    }
    //yellow to green (reduit le rouge)
    else {
        r = 255 * (1 - fraction) / 0.33;
        g = 255;
    }
    // retourne le rgb color
    return "rgb(" + r + " , " + g + ", " + b + ")";
}

function keyDown(e) {
    switch (e.keyCode) {
        case 32: //espace pour lancer une balle
            lance();
            if (gameOver) {
                newGame();
            }
            break;
        case 37:
            bougeSupport(Direction.LEFT);
            break;
        case 39:
            bougeSupport(Direction.RIGHT);
            break;
    }
}

function keyUp(e) {
    switch (e.keyCode) {
        case 37:
        case 39:
            bougeSupport(Direction.STOP);
            break;
    }
}

function bougeSupport(direction) {
    switch (direction) {
        case Direction.LEFT:
            support.xv = -support.spd;
            break;
        case Direction.RIGHT:
            support.xv = support.spd;
            break;
        case Direction.STOP:
            support.xv = 0;
            break;
    }
}

function newBall() {
    pUpExtensionSupport = false;
    pUpStickySupport = false;
    pUpSuperBall = false;
    support = new Support();
    ball = new Ball();
}

function newGame() {
    gameOver = false;
    niveau = 0;
    vies = viesJeu;
    score = 0;
    gagne = false;
    gameStart = true;
    //donne le score max enregistré
    let scoreStr = localStorage.getItem(scoreCle);
    if (scoreStr == null) {
        scoreHigh = 0;
    } else {
        scoreHigh = parseInt(scoreStr);
    }
    //commence un nouveau niveau
    nouveauNiveau();
}

function nouveauNiveau() {
    pUps = [];
    touchX = null;
    newBall();
    createBricks();
}

function horsRebond() {
    vies--;
    if (vies == 0) {
        gameOver = true;
        gameStart = false;
    }
    newBall();
}

function lance() {

    //balle en mvt
    if (ball.yv != 0) {
        return false;
    }
    //angle aléatoire (non moins que l'angle minimum de rebond )
    let minAngleRebond = angleMinRebond / 180 * Math.PI;
    let moyenne = Math.PI - minAngleRebond * 2
    let angle = Math.random() * moyenne + minAngleRebond;
    donneVitesseBall(pUpStickySupport ? Math.PI / 2 : angle);
    fxSupport.play();
    gameStart = false;
    return true;
}

function setDimensions() {
    height = window.innerHeight;
    width = window.innerWidth;
    murJeu = mur * (height < width ? height : width);
    monCanvas.width = width;
    monCanvas.height = height;
    newGame();
}

function spinBall() {
    let versHaut = ball.yv < 0;
    let angle = Math.atan2(-ball.yv, ball.xv);
    angle += (Math.random() * Math.PI / 2 - Math.PI / 4) * ballSpin;

    //angle minimum du rebond 
    let minAngleRebond = angleMinRebond / 180 * Math.PI;
    if (versHaut) {
        if (angle < minAngleRebond) {
            angle = minAngleRebond;
        } else if (angle > Math.PI - minAngleRebond) {
            angle = Math.PI - minAngleRebond
        }
    } else {
        if (angle > -minAngleRebond) {
            angle = -minAngleRebond;
        } else if (angle < -Math.PI + minAngleRebond) {
            angle = -Math.PI + minAngleRebond
        }
    }
    donneVitesseBall(angle);
}

//special Mobil et tablette
function touchCancel(e) {
    touchX = null;
    bougeSupport(Direction.STOP);
}

function touchEnd(e) {
    touchX = null;
    bougeSupport(Direction.STOP);
}

function touchMove(e) {
    touchX = e.touches[0].clientX;
}

function touchStart(e) {
    if (lance()) {
        if (gameOver) {
            newGame();
        }
        return;
    }
    touchX = e.touches[0].clientX;
}

function updateBall(delta) {
    ball.x += ball.xv * delta;
    ball.y += ball.yv * delta;

    //Rebond de la balle sur les murs
    if (ball.x < murJeu + ball.w / 2) {
        ball.x = murJeu + ball.w / 2;
        ball.xv = -ball.xv;
        fxMur.play();
        spinBall();
    } else if (ball.x > monCanvas.width - murJeu - ball.w / 2) {
        ball.x = monCanvas.width - murJeu - ball.w / 2;
        ball.xv = -ball.xv;
        fxMur.play();
        spinBall();
    } else if (ball.y < murJeu + ball.h / 2) {
        ball.y = murJeu + ball.h / 2
        ball.yv = -ball.yv;
        fxMur.play();
        spinBall();
    }

    //rebonds de la balle sur le support
    if (ball.y > support.y - support.h / 2 - ball.h / 2 &&
        ball.y < support.y + support.h / 2 &&
        ball.x > support.x - support.w / 2 - ball.w / 2 &&
        ball.x < support.x + support.w / 2 + ball.w / 2
    ) {
        ball.y = support.y - support.h / 2 - ball.h / 2;
        if (pUpStickySupport) {
            ball.xv = 0;
            ball.yv = 0;
        } else {
            ball.yv = -ball.yv;
            spinBall();
        }
        fxSupport.play();
    }

    // gestion du rebond
    if (ball.y > height) {
        horsRebond();
    }
}

function updateBricks(delta) {

    // check for ball collisions
    OUTER: for (let i = 0; i < bricks.length; i++) {
        for (let j = 0; j < colBrick; j++) {
            if (bricks[i][j] != null && bricks[i][j].intersect(ball)) {
                updateScore(bricks[i][j].score);
                ball.setSpeed(bricks[i][j].spdMult);

                // set ball to the edge of the brick
                if (ball.yv < 0) { // upwards
                    ball.y = bricks[i][j].bot + ball.h * 0.5;
                } else { // downwards
                    ball.y = bricks[i][j].top - ball.h * 0.5;
                }
                // cree un Power Up
                if (Math.random() <= pUpChance) {
                    let px = bricks[i][j].left + bricks[i][j].w / 2;
                    let py = bricks[i][j].top + bricks[i][j].h / 2;
                    let pSize = bricks[i][j].w / 2;
                    let pCles = Object.keys(PUpType);
                    let pCle = pCles[Math.floor(Math.random() * pCles.length)];
                    pUps.push(new PowerUp(px, py, pSize, PUpType[pCle]));
                }
                //Rebond de la balle (si ce n'est pas une super Ball) et destruction d'une brique
                if (!pUpSuperBall) {
                    ball.yv = -ball.yv;
                }
                bricks[i][j] = null;
                nbrBricks--;
                fxBrick.play();
                spinBall();
                break OUTER;
            }
        }
    }
    // niveau suivant
    if (nbrBricks == 0) {
        if (niveau < niveauMax) {
            niveau++;
            nouveauNiveau();
        } else {
            gameOver = true;
            gagne = true;
            newBall();
        }
    }
}

function updateSupport(delta) {
    // gere le toucher
    if (touchX != null) {
        if (touchX > support.x + murJeu) {
            bougeSupport(Direction.RIGHT);
        } else if (touchX < support.x - murJeu) {
            bougeSupport(Direction.LEFT);
        } else {
            bougeSupport(Direction.STOP);
        }
        gameStart = false;
    }
    //bouge le support
    let dernierSupportX = support.x;
    support.x += support.xv * delta;

    //arret du support au bord du jeu
    if (support.x < murJeu + support.w * 0.5) {
        support.x = murJeu + support.w * 0.5;
    } else if (support.x > monCanvas.width -
        murJeu - support.w * 0.5) {
        support.x = monCanvas.width - murJeu - support.w * 0.5;
    }

    //bouge la balle lorsqu'elle est immobile
    if (ball.yv == 0) {
        ball.x += support.x - dernierSupportX;;
    }

    //collecte Power Up
    for (let i = pUps.length - 1; i >= 0; i--) {
        if (
            pUps[i].x + pUps[i].w * 0.5 > support.x - support.w * 0.5 &&
            pUps[i].x - pUps[i].w * 0.5 < support.x + support.w * 0.5 &&
            pUps[i].y + pUps[i].h * 0.5 > support.y - support.h * 0.5 &&
            pUps[i].y - pUps[i].h * 0.5 < support.y + support.h * 0.5
        ) {
            switch (pUps[i].type) {
                case PUpType.extensionSupport:
                    //double la taile du support
                    if (pUpExtensionSupport) {
                        score += pUpBonus;
                    } else {
                        pUpExtension = true;
                        support.w *= 2;
                    }
                    break;
                case PUpType.viePlus:
                    //ajoute 1 vie
                    vies++;
                    break;
                case PUpType.stickySupport:
                    if (pUpStickySupport) {
                        score += pUpBonus;
                    } else {
                        pUpStickySupport = true;
                    }
                    break;
                case PUpType.superBall:
                    if (pUpSuperBall) {
                        score += pUpBonus;
                    } else {
                        pUpSuperBall = true;
                    }
                    break;
            }
            pUps.splice(i, 1);
            fxLevelPlus.play();
        }
    }
}

function updatePUps(delta) {
    for (let i = pUps.length - 1; i >= 0; i--) {
        pUps[i].y += pUps[i].yv * delta;

        // delete off-screen pups
        if (pUps[i].y - pUps[i].h * 0.5 > height) {
            pUps.splice(i, 1);
        }
    }
}

function updateScore(brickScore) {
    score += brickScore;

    // vérifie le score max
    if (score > scoreHigh) {
        scoreHigh = score;
        localStorage.setItem(scoreCle, scoreHigh);
    }
}

function Ball() {
    this.w = murJeu;
    this.h = murJeu;
    this.x = support.x;
    this.y = support.y - support.h / 2 - this.h / 2;
    this.spd = ballSpd * height;
    this.xv = 0;
    this.yv = 0;

    this.setSpeed = function (spdMult) {
        this.spd = Math.max(this.spd, ballSpd * height * spdMult);
    }
}

function Brick(left, top, w, h, color, score, spdMult) {
    this.w = w;
    this.h = h;
    this.bot = top + h;
    this.left = left;
    this.right = left + w;
    this.top = top;
    this.color = color;
    this.score = score;
    this.spdMult = spdMult;

    this.intersect = function (ball) {
        let bBot = ball.y + ball.h * 0.5;
        let bLeft = ball.x - ball.w * 0.5;
        let bRight = ball.x + ball.w * 0.5;
        let bTop = ball.y - ball.h * 0.5;
        return this.left < bRight &&
            bLeft < this.right &&
            this.bot > bTop &&
            bBot > this.top;
    }
}

function Support() {
    this.w = supportW * width;
    this.h = murJeu * supportSize;
    this.x = width / 2;
    this.y = height - murJeu * 3.5 + this.h / 2;
    this.spd = supportSpd * width;
    this.xv = 0;
}

function PowerUp(x, y, size, type) {
    this.w = size;
    this.h = size;
    this.x = x;
    this.y = y;
    this.type = type;
    this.yv = pUpSpd * height;
}