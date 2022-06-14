class Menu extends Phaser.Scene {
	constructor(){
		super('menu');
	}
	create(){
		let self = this;
		this.add.sprite(360,540,'bg_menu');
		let b_sound = draw_button(720-60,60, 'sound_on', this);
		b_sound.name = 'sound';
		check_audio(b_sound);
		//
		let title = this.add.sprite(360,315,'game_title');
		let b_play = draw_button(360, 680, 'play', this);
		//
		this.input.on('gameobjectdown', function(pointer, obj){
			if(obj.button){
				play_sound('click', self);
				self.tweens.add({
					targets: obj,
					scaleX: 0.95,
					scaleY: 0.95,
					yoyo: true,
					duration: 100,
					ease: 'Linear',
					onComplete: function(){
						if(obj.name === 'play'){
							self.scene.start('game');
						} else if(obj.name === 'sound'){
							switch_audio(obj);
						}
					}
				})
			}
		}, this);
	}
}