class Load extends Phaser.Scene {
	constructor(){
		super('load');
	}
	preload(){
		this.add.sprite(360,540,'bg_menu');
		this.add.sprite(360,315,'game_title');
		let bar = this.add.rectangle(config.width/2, 600, 600, 20);
		bar.setStrokeStyle(4, 0xffffff);
		bar.alpha = 0.7;
		let progress = this.add.rectangle(config.width/2, 600, 590, 10, 0xffffff);
		progress.alpha = 0.8;
		this.load.on('progress', (value)=>{
			progress.width = 590*value;
		});
		this.load.on('complete', ()=>{
			bar.destroy();
			progress.destroy();
			let b_start = draw_button(360, 700, 'start', this);
			this.tweens.add({
				targets: b_start,
				alpha: 0.5,
				yoyo: true,
				duration: 300,
				loop: -1,
			});
		}, this);
		this.input.on('gameobjectdown', ()=>{
			this.scene.start('menu');
		}, this);
		//
		//load all game assets
		this.load.image('bg_game', 'img/bg_game.png');
		this.load.image('footer', 'img/footer.png');
		this.load.image('window', 'img/window.png');
		this.load.image('tile', 'img/tile.png');
		this.load.image('tile_red', 'img/tile_red.png');
		this.load.image('tile_green', 'img/tile_green.png');
		this.load.image('ship1', 'img/ship1.png');
		this.load.image('ship2', 'img/ship2.png');
		this.load.image('ship3', 'img/ship3.png');
		this.load.image('ship4', 'img/ship4.png');
		this.load.image('ship5', 'img/ship5.png');
		this.load.image('missile1', 'img/missile1.png');
		this.load.image('missile2', 'img/missile2.png');
		this.load.image('weapon1', 'img/weapon1.png');
		this.load.image('weapon2', 'img/weapon2.png');
		this.load.image('turn1', 'img/turn1.png');
		this.load.image('turn2', 'img/turn2.png');
		this.load.image('btn_rotate', 'img/btn_rotate.png');
		this.load.image('btn_shuffle', 'img/btn_shuffle.png');
		this.load.image('btn_startwar', 'img/btn_startwar.png');
		this.load.image('btn_restart', 'img/btn_restart.png');
		this.load.image('btn_home', 'img/btn_home.png');
		this.load.image('btn_sound_on', 'img/btn_sound_on.png');
		this.load.image('btn_sound_off', 'img/btn_sound_off.png');
		this.load.image('btn_exit', 'img/btn_exit.png');
		this.load.image('btn_play', 'img/btn_play.png');
		this.load.image('btn_close', 'img/btn_close.png');
		this.load.spritesheet('exp', 'img/exp.png', {frameWidth: 60, frameHeight: 60});
		this.load.spritesheet('aim', 'img/aim.png', {frameWidth: 60, frameHeight: 60});
		this.load.spritesheet('splash', 'img/splash.png', {frameWidth: 60, frameHeight: 60});
		this.load.spritesheet('touch', 'img/touch.png', {frameWidth: 100, frameHeight: 200});
		this.load.spritesheet('guide', 'img/guide.png', {frameWidth: 234, frameHeight: 180});
		//Load all audio
		this.load.audio('completed', 'audio/completed.mp3');
		this.load.audio('click', 'audio/click.mp3');
		this.load.audio('shoot', 'audio/shoot.mp3');
		this.load.audio('splash', 'audio/splash.mp3');
		this.load.audio('explosion', 'audio/explosion.mp3');
		this.load.audio('hit', 'audio/hit.mp3');
		this.load.audio('move', 'audio/move.mp3');
		this.load.audio('click2', 'audio/click2.mp3');
		this.load.audio('turn', 'audio/turn.mp3');
		this.load.audio('gameover', 'audio/gameover.mp3');
	}
	create(){
		//this.scene.start('game');
	}
}