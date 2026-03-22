const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gravity = 0.7;
const friction = 0.85;

let hitPause = 0;
let comboCount = 0;

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

class Fighter {
    constructor(color, x) {
        this.x = x;
        this.y = 320;
        this.width = 60;
        this.height = 120;

        this.color = color;
        this.speed = 0.7;

        this.velocityX = 0;
        this.velocityY = 0;

        this.health = 100;
        this.displayHealth = 100;
        this.damageHealth = 100;

        this.facing = 1;
        this.hitstun = 0;

        this.attack = null;
        this.attackTimer = 0;
        this.cooldown = 0;
        this.hasHit = false;
    }

    update() {

        if (hitPause > 0) return;

        if (this.hitstun > 0) this.hitstun--;
        if (this.cooldown > 0) this.cooldown--;

        this.velocityY += gravity;

        this.x += this.velocityX;
        this.y += this.velocityY;

        this.velocityX *= friction;

        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

        if (this.y + this.height >= 440) {
            this.y = 440 - this.height;
            this.velocityY = 0;
        }

        if (this.attackTimer > 0) this.attackTimer--;
        else this.attack = null;

        this.displayHealth += (this.health - this.displayHealth) * 0.2;
        this.damageHealth += (this.health - this.damageHealth) * 0.05;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        if (this.attack) {
            const hb = this.getHitbox();
            ctx.fillStyle = "rgba(255,80,0,0.6)";
            ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
        }
    }

    getHitbox() {
        return {
            x: this.facing === 1
                ? this.x + this.width
                : this.x - this.attack.range,
            y: this.y + 40,
            w: this.attack.range,
            h: 50
        };
    }

    move(dir) {
        if (this.hitstun > 0) return;
        this.velocityX += dir * this.speed;
        this.facing = dir;
    }

    jump() {
        if (this.velocityY === 0)
            this.velocityY = -15;
    }

    doAttack(type) {

        if (this.cooldown > 0) return;

        const moves = {
            light: { damage: 6, stun: 12, kb: 5, range: 50, time: 12, cd: 18 },
            heavy: { damage: 18, stun: 30, kb: 15, range: 80, time: 18, cd: 40 }
        };

        this.attack = moves[type];
        this.attackTimer = this.attack.time;
        this.cooldown = this.attack.cd;
        this.hasHit = false;
    }

    takeHit(data, dir) {

        this.health -= data.damage;
        this.hitstun = data.stun;
        this.velocityX = dir * data.kb;

        hitPause = 5;
        comboCount++;

        spawnImpact(this.x + this.width/2, this.y + 60);
    }
}

function spawnImpact(x,y){
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.arc(x,y,20,0,Math.PI*2);
    ctx.fill();
}

function collision(a,b){
    return a.x < b.x+b.width &&
           a.x+a.width > b.x &&
           a.y < b.y+b.height &&
           a.y+a.height > b.y;
}

function combat(a,b){

    if(!a.attack || a.hasHit) return;

    const hb=a.getHitbox();
    const hurt={x:b.x,y:b.y,width:b.width,height:b.height};

    if(hb.x<hurt.x+hurt.width &&
       hb.x+hb.w>hurt.x &&
       hb.y<hurt.y+hurt.height &&
       hb.y+hb.h>hurt.y){

        b.takeHit(a.attack,a.facing);
        a.hasHit=true;
    }
}

function drawMap(){

    ctx.fillStyle="#228B22";
    ctx.fillRect(0,440,canvas.width,60);

    ctx.fillStyle="rgba(0,0,0,0.2)";
    for(let i=0;i<canvas.width;i+=100){
        ctx.fillRect(i,440,50,60);
    }
}

function updateUI(){
    document.getElementById("playerHealth").style.width=player.displayHealth+"%";
    document.getElementById("enemyHealth").style.width=enemy.displayHealth+"%";

    document.getElementById("playerDamage").style.width=player.damageHealth+"%";
    document.getElementById("enemyDamage").style.width=enemy.damageHealth+"%";

    document.getElementById("comboCounter").innerText=
        comboCount>1?comboCount+" HIT COMBO":"";
}

function AI(){

    const dist=player.x-enemy.x;
    const abs=Math.abs(dist);

    enemy.facing=dist>0?1:-1;

    if(abs>150) enemy.move(enemy.facing);
    if(abs<80) enemy.move(-enemy.facing);

    if(abs<120 && enemy.cooldown===0){
        enemy.doAttack(Math.random()<0.6?"light":"heavy");
    }
}

let player=new Fighter("purple",150);
let enemy=new Fighter("blue",650);

function animate(){

    requestAnimationFrame(animate);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(hitPause>0){hitPause--; return;}

    if(keys["a"]) player.move(-1);
    if(keys["d"]) player.move(1);
    if(keys["w"]) player.jump();
    if(keys["j"]) player.doAttack("light");
    if(keys["k"]) player.doAttack("heavy");

    player.update();
    enemy.update();

    AI();
    combat(player,enemy);
    combat(enemy,player);

    drawMap();
    player.draw();
    enemy.draw();
    updateUI();
}

animate();
