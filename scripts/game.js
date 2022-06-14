var first_play = 1;
var game_data = {
	sound: true,
}
class Game extends Phaser.Scene {
	constructor(){
		super('game');
	}
	create(){
		let self = this;
		let tiles = this.add.group();
		let ships = this.add.group();
		let ship_rotator = this.add.group();
		let popup = this.add.group();
		let turn = 2;
		let state = 'prepare';
		let weapon_type = { //Stores what weapon type for each player
			player: [0,1,1],
			count: [0,0,0],
			def: 3,
		}
		let bot = { //Store bot stats
			last_hit: 0,
			prediction: 0,
			prev_hit: 0,
		}
		let destroyed_ship = []; //collect destroyed ship for bot
		this.anims.create({
		    key: 'explosion',
		    frames: this.anims.generateFrameNumbers('exp'),
		    frameRate: 8,
		    repeat: -1,
		});
		this.anims.create({
		    key: 'aim',
		    frames: this.anims.generateFrameNumbers('aim'),
		    frameRate: 8,
		    repeat: -1,
		});
		this.anims.create({
		    key: 'splash',
		    frames: this.anims.generateFrameNumbers('splash'),
		    frameRate: 8,
		});
		this.anims.create({
		    key: 'touch',
		    frames: this.anims.generateFrameNumbers('touch'),
		    frameRate: 5,
		    repeat: -1,
		});
		this.anims.create({
		    key: 'guide',
		    frames: this.anims.generateFrameNumbers('guide'),
		    frameRate: 5,
		    repeat: -1,
		});
		this.add.sprite(360, 540, 'bg_game');
		this.add.sprite(360, 1080, 'footer').setOrigin(0.5, 1);
		//Conf
		let width = 10;
		let height = 12;
		let break_at = 6;
		let size = 60;
		let start_x = (config.width-(size*width))/2;
		let start_y = 120;
		let break_space = 60;
		//End
		let array = new Array(height);
		for(let y=0; y<height; y++){ //Generate blocks
			array[y] = [];
			let plus_y = 0;
			if(y >= break_at){
				plus_y = break_space;
			}
			for(let x=0; x<width; x++){
				array[y].push(0);
				let tile = this.add.sprite(start_x+(x*size), start_y+(y*size)+plus_y, 'tile');
				tile.setOrigin(0);
				tile.setInteractive();
				tile.block = true;
				tile.pos = {x: x, y: y};
				tile.player = 2;
				if(plus_y){
					tile.player = 1;
				}
				tiles.add(tile);
			}
		}
		//Add initial player ships
		for(let i=0; i<5; i++){ //Computer
			let ship = this.add.sprite(start_x+(i*size), start_y, 'ship'+(i+1));
			ship.setOrigin(0);
			ship.horizontal = false;
			ship.type = i+1;
			ship.pos = {x: i, y: 0};
			ship.player = 2; //Bot
			ship.setVisible(false);
			ships.add(ship);
		}
		for(let i=0; i<5; i++){ //Human
			let ship = this.add.sprite(start_x+(i*size), start_y+(size*(break_at+1)), 'ship'+(i+1)).setInteractive();
			ship.setOrigin(0);
			ship.horizontal = false;
			ship.type = i+1;
			ship.pos = {x: i, y: break_at};
			ship.player = 1; //Human
			this.input.setDraggable(ship);
			ships.add(ship);
			let rotator = draw_button(ship.x, ship.y, 'rotate', this);
			rotator.setOrigin(0,1);
			rotator.type = i+1;
			rotator.rotator = true;
			ship_rotator.add(rotator);
		}
		update_array();
		randomize_ship(2); //Randomize bot ships
		//
		let used_weapon = this.add.sprite(360, 1000, 'weapon'+weapon_type.player[1]);
		let touch_hand = this.add.sprite(360, 280, 'touch');
		touch_hand.play('touch');
		touch_hand.setVisible(false);
		let aim = this.add.sprite(0, 0, 'aim').setOrigin(0);
		aim.play('aim');
		aim.setVisible(false);
		let turn_info = this.add.sprite(360, 500, 'turn1');
		turn_info.alpha = 0;
		//Draw buttons
		let b_home = draw_button(60, 60, 'home', this);
		let b_sound = draw_button(720-60, 60, 'sound_on', this);
		b_sound.name = 'sound';
		check_audio(b_sound);
		let b_shuffle = draw_button(150, 970, 'shuffle', this);
		let b_start = draw_button(600, 970, 'startwar', this);
		if(first_play){
			show_guide();
		}
		this.input.on('drag', function (pointer, obj, dragX, dragY) {
			if(state === 'prepare'){
				let to_x = Phaser.Math.Snap.To(dragX, 60);
				let to_y = Phaser.Math.Snap.To(dragY, 60);
				if(on_area(to_x, to_y, obj.type, obj.horizontal)){
					obj.x = to_x;
					obj.y = to_y;
				}
			}
		});
		this.input.on('dragstart', function (pointer, obj) {
			if(state === 'prepare'){
				obj.last = obj.pos;
				hide_rotator();
			}
		});
		this.input.on('dragend', function (pointer, obj) {
			if(state === 'prepare'){
				obj.pos = get_pos(obj.x, obj.y);
				if(!is_overlap(obj.x, obj.y, obj.type, obj.horizontal)){ //Drop/move ships
					update_array(1);
					reposition();
					play_sound('move', self);
					//show();
				} else {
					move_back(obj); //Miss
				}
			}
		});
		this.input.on('gameobjectdown', function (pointer, obj) {
			if(obj.rotator && state === 'prepare'){
				rotate_ship(obj.type);
			}
			if(obj.block && turn === 1){ //Player turn
				if(obj.player === 2){
					if(state === 'prepare'){
						//start_war();
					}
					if(array[obj.pos.y][obj.pos.x] != -1 && state === 'play'){
						spawn_missile(obj.x, obj.y, obj.pos, 1);
					}
				}
			}
			if(obj.button){
				self.tweens.add({
					targets: obj,
					scaleX: 0.95,
					scaleY: 0.95,
					yoyo: true,
					duration: 100,
					ease: 'Linear',
					onComplete: function(){
						if(state === 'prepare'){
							if(obj.name === 'shuffle'){
								play_sound('click2', self);
								randomize_ship(1);
							} else if(obj.name === 'startwar'){
								play_sound('click2', self);
								start_war();
								pre_bot_fire();
							}
						}
						if(state != 'gameover'){
							if(obj.name === 'home'){
								play_sound('click', self);
								self.scene.start('menu');
							} else if(obj.name === 'sound'){
								play_sound('click', self);
								switch_audio(obj);
							}
						}
						if(obj.name === 'restart'){
							play_sound('click', self);
							self.scene.start('game');
						} else if(obj.name === 'exit'){
							play_sound('click', self);
							self.scene.start('menu');
						} else if(obj.name === 'close'){
							play_sound('click', self);
							popup.clear(true, true);
							state = 'prepare';
						}
					}
				});
			}
		});
		function show(){
			let total = tiles.getLength();
			let child = tiles.getChildren();
			for(let y=0; y<height; y++){
					for(let x=0; x<width; x++){
						if(array[y][x]){
							show_tile(x,y,true);
						} else {
							show_tile(x,y,false);
						}
					}
				}
			function show_tile(x,y,e){
				for(let i=0; i<total; i++){
					let tile = child[i];
					if(tile.pos.x === x && tile.pos.y === y){
						tile.type = array[y][x];
						if(e){
							tile.alpha = 0.5;
						} else {
							tile.alpha = 1;
						}
						
					}
				}
			}
		}
		function get_pos(x, y){
			let xx = (x/60)-1;
			let yy = ((y-start_y-break_space)/60);
			return {x: xx, y: yy};
		}
		function get_type(e){
			if(e === 1){
				return 5;
			} else if(e === 2){
				return 4;
			} else if(e === 3){
				return 3;
			} else if(e === 4){
				return 3;
			} else if(e === 5){
				return 2;
			}
		}
		function update_array(player, ship){
			let total = ships.getLength();
			let child = ships.getChildren();
			if(ship){
				let type = Number(get_type(ship.type));
				if(ship.horizontal){
					for(let j=0; j<type; j++){
						array[Number(ship.pos.y)][Number(ship.pos.x)+j] = ship.type;
						//console.log(ship.type+', x '+(Number(ship.pos.x)+j)+', '+ship.pos.y);
					}
				} else {
					for(let j=0; j<type; j++){
						array[Number(ship.pos.y)+j][ship.pos.x] = ship.type;
						//console.log(ship.type+', x '+ship.pos.x+', '+(Number(ship.pos.y)+j));
					}
				}
			} else {
				clear_array(player);
				for(let i=0; i<total; i++){
					let ship = child[i];
					let type = get_type(ship.type);
					if(!ship.horizontal){
						for(let j=0; j<type; j++){
							array[ship.pos.y+j][ship.pos.x] = ship.type;
						}
					} else {
						for(let j=0; j<type; j++){
							array[ship.pos.y][ship.pos.x+j] = ship.type;
						}
					}
				}
			}
				
		}
		function clear_array(player){
			let min_y = 0;
			let max_y = break_at;
			if(player){
				if(player === 1){
					min_y = break_at;
					max_y = height;
				}
			} else {
				max_y = height;
			}
			for(let y=min_y; y<max_y; y++){
				for(let x=0; x<width; x++){
					array[y][x] = 0;
				}
			}
		}
		function on_area(x, y, type, rotate, pos, player){
			if(!pos){
				pos = get_pos(x, y);
			}
			let min_y = 6;
			let max_y = height;
			if(player){
				if(player === 2){
					min_y = 0;
					max_y = 6;
				}
			}
			let type2 = get_type(type);
			let plus = {};
			if(!rotate){
				plus.x = 0;
				plus.y = type2-1;
			} else {
				plus.x = type2-1;
				plus.y = 0;
			}
			
			if(pos.x < 0 || pos.x+plus.x >= width){
				return false;
			}
			if(pos.y < min_y || pos.y+plus.y >= max_y){
				return false;
			}
			return true;
		}
		function is_overlap(x, y, type, rotate, pos){
			if(!pos){
				pos = get_pos(x, y);
			}
			let type2 = get_type(type);
			if(!rotate){
				for(let i=pos.y; i<(pos.y+type2); i++){
					if(array[i][pos.x] && array[i][pos.x] != type){
						return true;
					}
				}
			} else {
				for(let i=pos.x; i<(pos.x+type2); i++){
					if(array[pos.y][i] && array[pos.y][i] != type){
						return true;
					}
				}
			}
			return false;
		}
		function move_back(obj){ //Miss
			obj.pos = Object.assign({}, obj.last);
			let to_y = start_y+((obj.pos.y+1)*size);
			if(obj.horizontal){
				//to_y += size;
			}
			self.tweens.add({
				targets: obj,
				x: start_x+(obj.pos.x*size),
				y: to_y,
				duration: 200,
				ease: 'Sine.easeOut',
				onComplete: function(){
					reposition();
				}
			});
		}
		function reposition(){ //Reposition for each rotator
			let total = ships.getLength();
			let child = ships.getChildren();
			let child2 = ship_rotator.getChildren();
			for(let i=0; i<total; i++){
				let ship = child[i];
				for(let j=0; j<total; j++){
					let rotator = child2[j];
					rotator.setVisible(true);
					if(rotator.type === ship.type){
						rotator.setPosition(ship.x, ship.y);
						break;
					}
				}
			}
		}
		function hide_rotator(){
			let total = ship_rotator.getLength();
			let child = ship_rotator.getChildren();
			for(let i=0; i<total; i++){
				let rotator = child[i];
				rotator.setVisible(false);
			}
		}
		function get_rad(angle){ //Degress to radian
			return angle * Math.PI / 180;
		}
		function update_ship_position(obj){
			let plus_y = 0;
			if(obj.player === 1){
				plus_y = 1;
			}
			obj.setPosition(start_x+(obj.pos.x*size), start_y+((obj.pos.y+plus_y)*size));
			if(!obj.horizontal){
				obj.setRotation(get_rad(0));
				obj.setOrigin(0);
				//obj.y -= size;
			} else {
				obj.setRotation(get_rad(270));
				obj.setOrigin(1,0);
				//obj.y += size;
			}
		}
		function rotate_ship(id){
			let selected;
			let total = ships.getLength();
			let child = ships.getChildren();
			for(let i=0; i<total; i++){
				let ship = child[i];
				if(ship.type === id){
					selected = ship;
				}
			}
			let res = can_rotate(selected.x, selected.y, selected.type, selected.horizontal);
			if(res){
				selected.pos = res;
				selected.setPosition(start_x+(selected.pos.x*size), start_y+((selected.pos.y+1)*size));
				if(selected.horizontal){
					selected.horizontal = false;
					selected.setRotation(get_rad(0));
					selected.setOrigin(0);
					//selected.y -= size;
				} else {
					selected.horizontal = true;
					selected.setRotation(get_rad(270));
					selected.setOrigin(1,0);
					//selected.y += size;
				}
				update_array();
				reposition();
			} else {
				//alert('cant')
			}
				
		}
		function can_rotate(x, y, type, rotate){ //Check if selected ship can be rotated
			let pos = get_pos(x, y);
			let type2 = get_type(type);
			let s_x = pos.x; //start
			let s_y = pos.y;
			let e_x = pos.x+type2-1; //end
			let e_y = pos.y+1;
			if(rotate){
				rotate = false;
			} else {
				rotate = true;
			}
			for(let yy=s_y; yy<e_y; yy++){
				for(let xx=s_x; xx<e_x; xx++){
					if(on_area(xx, yy, type, rotate, {x: xx, y: yy})){
						if(!is_overlap(xx, yy, type, rotate, {x: xx, y: yy})){
							return {x: xx, y: yy};
						}
					}
				}
			}
			return false;
		}
		function randomize_ship(player){ //Randomize ship position
			clear_array(player);
			let total = ships.getLength();
			let child = ships.getChildren();
			for(let i=0; i<total; i++){
				let ship = child[i];
				if(ship.player === player){ //Pick selected player
					loop:
					for(let j=0; j<1000; j++){
						let rand = Math.random()*100;
						if(rand > 50){
							ship.horizontal = true;
						} else {
							ship.horizontal = false;
						}
						let rand_x = Math.floor(Math.random()*width);
						let rand_y = Math.floor(Math.random()*break_at)+break_at;
						if(player === 2){
							rand_y -= break_at;
						}
						if(on_area(0, 0, ship.type, ship.horizontal, {x: rand_x, y: rand_y}, player)){
							if(!is_overlap(0, 0, ship.type, ship.horizontal, {x: rand_x, y: rand_y})){
								ship.pos = {x: rand_x, y: rand_y};
								update_array(player, ship);
								update_ship_position(ship);
								break loop;
							}
						}
					}
				}
			}
			reposition();
		}
		function change_turn(){
			if(check_winner()){
				gameover();
			} else {
				if(turn === 1){
					turn = 2;
					pre_bot_fire();
				} else {
					turn = 1;
					turn_info.setTexture('turn'+turn);
					if(first_play){
						touch_hand.setVisible(true);
					}
					setTimeout(()=>{
						play_sound('turn', self);
						self.tweens.add({
							targets: turn_info,
							alpha: 1,
							duration: 200,
							ease: 'Linear',
							onComplete: function(){
								self.tweens.add({
									targets: turn_info,
									alpha: 0,
									duration: 200,
									delay: 1000,
									ease: 'Linear',
									onComplete: function(){
										//
									}
								})
							}
						});
					}, 500);
				}
			}
		}
		function check_ship_destroyed(type){
			//Check if a ship are fully destroyed
			//Then show it
			let destroyed = true;
			let s_y = 0;
			let e_y = break_at;
			if(turn === 2){
				s_y = break_at;
				e_y = height;
			}
			loop:
			for(let y=s_y; y<e_y; y++){
				for(let x=0; x<width; x++){
					if(array[y][x] === type){
						destroyed = false;
						break loop;	
					}
				}
			}
			if(destroyed){ //Show destroyed ship
				show_ship(type);
			}
		}
		function show_ship(type){
			play_sound('explosion', self);
			//Show a ship if fully destroyed
			let opponent = 1;
			if(turn === 1){
				opponent = 2;
			} else {
				destroyed_ship.push(type);
				if(bot.last_hit){
					bot.last_hit = 0;
					bot.prediction = 0;
					bot.prev_hit = 0;
				}
			}
			let total = ships.getLength();
			let child = ships.getChildren();
			for(let i=0; i<total; i++){
				let ship = child[i];
				if(ship.player === opponent && ship.type === type){
					ship.setVisible(true);
					break;
				}
			}
		}
		function destroy_entire_ship(pos){
			//Destroy full ship body
			//With special missile
			let target_type = array[pos.y][pos.x];
			show_ship(target_type);
			let s_y = 0;
			let e_y = break_at;
			if(turn === 2){
				s_y = break_at;
				e_y = height;
			}
			let total = tiles.getLength();
			let child = tiles.getChildren();
			for(let y=s_y; y<e_y; y++){
				for(let x=0; x<width; x++){
					if(array[y][x] === target_type){
						for(let i=0; i<total; i++){
							let tile = child[i];
							if(tile.pos.x === x && tile.pos.y === y){
								//self.add.sprite(tile.x, tile.y, 'tile_red').setOrigin(0);
								change_tile({x: x, y:y}, 'tile_red');
								let exp = self.add.sprite(tile.x, tile.y, 'exp').setOrigin(0);
								exp.play('explosion');
								array[y][x] = -1; //hit
								break;
							}
						}
								
					}
				}
			}
		}
		function change_tile(pos, key){
			let total = tiles.getLength();
			let child = tiles.getChildren();
			for(let i=0; i<total; i++){
				let tile = child[i];
				if(tile.pos.x === pos.x && tile.pos.y === pos.y){
					tile.setTexture(key);
					break;
				}
			}
		}
		function fire(x, y, pos, missile_type){
			//Missile are already landed on target block
			let target_type = array[pos.y][pos.x];
			if(target_type){
				if(missile_type === 1){ //Blue missile
					//self.add.sprite(x, y, 'tile_red').setOrigin(0);
					play_sound('hit', self);
					change_tile(pos, 'tile_red');
					let exp = self.add.sprite(x, y, 'exp').setOrigin(0);
					exp.play('explosion');
					array[pos.y][pos.x] = -1; //hit
					check_ship_destroyed(target_type);
				} else { //Orange missile
					//Destroy entire ship
					destroy_entire_ship(pos);
				}					
			} else {
				change_tile(pos, 'tile_green');
				//self.add.sprite(x, y, 'tile_green').setOrigin(0);
				array[pos.y][pos.x] = -1; //miss
				spawn_splash(x,y);
			}
			change_turn();
		}
		function check_special(){
			//Actually it's a cheat for bot
			//Especially if there are some blocks left
			//Make bot more harder to beat
			if(destroyed_ship.length >= 3){ //If bot already destroyed more than 3 ship
				let block_left = 0;
				for(let y=break_at; y<height; y++){
					for(let x=0; x<width; x++){
						if(array[y][x] > 0){
							block_left++;
						}
					}
				}
				if(block_left <= 4){ //If there are 4 blocks or less left
					return true;
				}
			}
			return false;
		}
		function pre_bot_fire(){
			setTimeout(bot_fire, 1000);
		}
		function bot_fire(){
			//A bot choice where to shot
			//And make it as close as human think
			let pos;
			let next = false;
			if(bot.last_hit){ //Last hit
				//Fire around
				let to = [
					[-1,0], //Left 1
					[1,0], //Right 2
					[0,-1], //Up 3
					[0, 1] //Down 4
				];
				if(!bot.prediction && bot.prev_hit){
					if(bot.prev_hit.x > bot.last_hit.x){
						bot.prediction = 2; //Right
					} else if(bot.prev_hit.x < bot.last_hit.x){
						bot.prediction = 1; //Left
					} else if(bot.prev_hit.y < bot.last_hit.y){
						bot.prediction = 3; //Up
					} else if(bot.prev_hit.y > bot.last_hit.y){
						bot.prediction = 4; //Down
					}
				}
				for(let i=0; i<20; i++){
					let rand = Math.floor(Math.random()*to.length);
					if(bot.prediction){
						if(i === 0){
							rand = bot.prediction-1;
						} else {
							bot.prediction = 0;
							bot.prev_hit = 0;
						}
					}
					let prev = bot.last_hit;
					if(bot.prev_hit){
						prev = bot.prev_hit;
					}
					pos = {x: prev.x+(to[rand][0]), y: prev.y+(to[rand][1])};
					if(!bot.prediction && !bot.prev_hit){
						//
					}	
					if(pos.x >= 0 && pos.x < width && pos.y >= break_at && pos.y < height){
						if(array[pos.y][pos.x] != -1){
							if(array[pos.y][pos.x] === 0){ //Miss
								if(bot.prediction){ //Prediction miss
									bot.prediction = 0;
									bot.prev_hit = 0;
								}
							} else {
								bot.prev_hit = pos;
							}
							next = true;
							break;
						}
					}
				}
			} else {
				//Just pick random block
				let cheated = false;
				if(check_special()){ //Cheat bot
					//Special cheat for bot
					//Since this game bot/AI are not smart enough :-D
					if(Math.random()*100 < 40){ //Give it 40% chance
						//Start finding hidden player ship :-D
						let arr = [];
						for(let y=break_at; y<height; y++){
							for(let x=0; x<width; x++){
								if(array[y][x] > 0){
									arr.push({x: x, y:y});
								}
							}
						}
						cheated = true;
						pos = arr[Math.floor(Math.random()*arr.length)]; //Pick random one
						bot.last_hit = pos;
						//console.log('cheated');
						next = true;
					} else {
						//console.log('not cheated');
					}
				}
				if(!cheated){
					for(let i=0; i<1000; i++){
						let rand_x = Math.floor(Math.random()*width);
						let rand_y = Math.floor(Math.random()*break_at)+break_at;
						if(array[rand_y][rand_x] != -1){
							pos = {x: rand_x, y: rand_y};
							if(array[rand_y][rand_x] > 0){
								bot.last_hit = pos;
							}
							next = true;
							break;
						}
					}
				}
			}
			if(next){
				let total = tiles.getLength();
				let child = tiles.getChildren();
				for(let i=0; i<total; i++){
					let tile = child[i];
					if(tile.pos.x === pos.x && tile.pos.y === pos.y){
						spawn_missile(tile.x, tile.y, pos, 2);
						break;
					}
				}
			} else {
				bot.last_hit = 0;
				bot.prediction = 0;
				bot.prev_hit = 0;
				pre_bot_fire();
			}
		}
		function spawn_missile(x, y, pos, player){
			play_sound('shoot', self);
			if(first_play && player === 1){
				first_play = false;
				touch_hand.destroy(true, true);
			}
			state = 'missile';
			aim.setPosition(x, y);
			aim.setVisible(true);
			let s_y = 860; //Start y
			if(player === 2){
				s_y = 0;
			}
			let missile_type = weapon_type.player[player];
			let missile = self.add.sprite(x, s_y, 'missile'+missile_type);
			missile.setOrigin(0);
			if(player === 2){
				missile.scaleY = -1;
			}
			//
			weapon_type.count[player]++;
			if(weapon_type.player[player] === 2){
				weapon_type.player[player] = 1;
				weapon_type.count[player] = 0;
			}
			if(weapon_type.count[player] >= weapon_type.def){
				weapon_type.count[player] = 0;
				weapon_type.player[player] = 2;
			}
			if(weapon_type.player[1] === 2){
				used_weapon.setTexture('weapon2');
			} else {
				used_weapon.setTexture('weapon1');
			}
			self.tweens.add({ //Missile travel
				targets: missile,
				y: y,
				duration: 1000,
				ease: 'Sine.easeIn',
				onComplete: function(){
					state = 'play';
					missile.destroy(true, true);
					aim.setVisible(false);
					fire(x, y, pos, missile_type);
				}
			});
		}
		function spawn_splash(x,y){
			play_sound('splash', self);
			let splash = self.add.sprite(x, y, 'splash').setOrigin(0);
			splash.play('splash');
			splash.on('animationcomplete', ()=>{
				splash.destroy(true, true);
			})
		}
		function start_war(){
			//state = 'play';
			b_start.setVisible(false);
			b_shuffle.setVisible(false);
			hide_rotator();
		}
		function check_winner(){
			let p1 = 0;
			let p2 = 0;
			loop:
			for(let y=0; y<break_at; y++){
				for(let x=0; x<width; x++){
					if(array[y][x] > 0){
						p2++;
						break loop;
					}
				}
			}
			loop:
			for(let y=break_at; y<height; y++){
				for(let x=0; x<width; x++){
					if(array[y][x] > 0){
						p1++;
						break loop;
					}
				}
			}
			if(!p1){
				return 2;
			}
			if(!p2){
				return 1;
			}
			return 0;
		}
		function gameover(){
			state = 'gameover';
			let total = ships.getLength();
			let child = ships.getChildren();
			for(let i=0; i<total; i++){
				let ship = child[i];
				if(!ship.visible){
					ship.setVisible(true)
				}
			}
			if(check_winner() === 2){
				setTimeout(()=>{
					show_window('YOU LOSE');
					play_sound('gameover', self);
				}, 3000);
			} else {
				setTimeout(()=>{
					show_window('YOU WIN');
					play_sound('completed', self);
				}, 3000);
			}
		}
		function show_window(str){
			let dark = self.add.rectangle(0,0,720,1080,0x00000, 0.5).setOrigin(0);
			let win = self.add.sprite(360, 540, 'window');
			let title = self.add.text(360, 400, str, {fontFamily: 'robotomono', fontSize: 65, align: 'center', color: '#fff'}).setOrigin(0.5);
			let b_restart = draw_button(360, 540, 'restart', self);
			let b_exit = draw_button(360, 650, 'exit', self);
			popup.addMultiple([dark, win, b_restart, b_exit, title]);
		}
		function show_guide(){
			state = 'guide';
			let dark = self.add.rectangle(0,0,720,1080,0x00000, 0.5).setOrigin(0);
			let guide = self.add.sprite(360, 540, 'guide');
			guide.setScale(2);
			guide.play('guide');
			//let win = self.add.sprite(360, 540, 'window');
			//let title = self.add.text(360, 400, str, {fontFamily: 'robotomono', fontSize: 65, align: 'center', color: '#fff'}).setOrigin(0.5);
			//let b_restart = draw_button(360, 540, 'restart', self);
			let b_close = draw_button(590, 360, 'close', self);
			popup.addMultiple([dark, guide, b_close]);
		}
	}
}
function play_sound(id, scope){
	if(game_data.sound){
		scope.sound.play(id);
	}
}
function switch_audio(obj){
	if(game_data[obj.name]){
		game_data[obj.name] = false;
		obj.setTexture('btn_sound_off');
	} else {
		game_data[obj.name] = true;
		obj.setTexture('btn_sound_on');
	}
}
function check_audio(obj){
	if(game_data[obj.name]){
		obj.setTexture('btn_sound_on');
	} else {
		obj.setTexture('btn_sound_off');
	}
}
function draw_button(x, y, id, scope){
	var o = scope.add.sprite(x, y, 'btn_'+id).setInteractive();
	o.button = true;
	o.name = id;
	return o;
}
var config = {
	type: Phaser.AUTO,
	width: 720,
	height: 1080,
	scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game_content',
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
	scene: [Boot, Load, Menu, Game],
}
var game = new Phaser.Game(config);