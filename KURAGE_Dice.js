//=============================================================================
// KURAGE_Dice.js
// ----------------------------------------------------------------------------
// Copyright (c) 2017 KURAGE
// Released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.0.0 2017/08/03 初版
// ----------------------------------------------------------------------------
// [Twitter]: https://twitter.com/kurageya0307
//=============================================================================

/*:
 * @plugindesc サイコロプラグイン
 * @author Y.KURAGE
 *
 * @param 結果の代入先の変数
 * @desc サイコロを振った結果を代入する変数番号を指定します。
 * @default 1
 *
 * @param ピクチャ開始番号
 * @desc このパラメータで指定したピクチャ番号から6つを使用します。デフォルトのままならばピクチャ番号 1～6番が使用されます。	
 * @default 1
 *
 * @help サイコロをふるプラグインです。
 * プラグインコマンド「showDice」でサイコロを表示します。
 * その後，プラグインコマンド「throwDice」でサイコロを振ります。
 * サイコロの結果はプラグインパラメータで設定した変数に代入されます。
 *
 * プラグインコマンド
 * 「showDice X Y」
 * 　X Yで指定した座標にサイコロを表示します。
 *
 * 「throwDice」
 *　 サイコロを振ります。
 *
 * ライセンス：
 *  本プラグインはMITライセンスです。
 *　ヘッダー部に著作権表示とMITライセンスのURLを書いていただければ，
 *　自由に改変，使用（非商用・商用・R-18何でも可）していただいて問題ありません。
 */

(function() {
    'use strict';

    //=============================================================================
    // パラメータの取得
    //=============================================================================
    var parameters = PluginManager.parameters('KURAGE_Dice');
    var variables_index = Number(parameters['結果の代入先の変数'] || 0);
    var picture_id_start = Number(parameters['ピクチャ開始番号'] || 0);

    //=============================================================================
    //  プラグインコマンドを追加定義
    //=============================================================================

    var _Game_Interpreter_pluginCommand      = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        switch(command) {
            case 'showDice':
                var x = parseInt(args[0], 10).clamp(1, 400) || 1;
                var y = parseInt(args[1], 10).clamp(1, 400) || 1;
                $gameScreen.showDice(picture_id_start, 0, x, y, 100.0, 100.0, 255, 0);
                break;
            case 'throwDice':
                $gameScreen.throwDice(100, 100);
                break;
        }
    };

    function Dice_Picture() {
        this.initialize.apply(this, arguments);
        this._durations = [];
        this._target_xs = [];
        this._target_ys = [];
        this._target_opacities = [];
    }
    
    Dice_Picture.prototype = Object.create(Game_Picture.prototype);
    Dice_Picture.prototype.constructor = Dice_Picture;
    Dice_Picture.prototype.setMoves = function(array) {
        this._durations = [];
        this._target_xs = [];
        this._target_ys = [];
        this._target_opacities = [];
        for(var i=0; i<array.length; i++) {
            this._durations.push(array[i]._duration);
            this._target_xs.push(array[i]._target_x);
            this._target_ys.push(array[i]._target_y);
            this._target_opacities.push(array[i]._target_opacity);
        }
        this._move_index = 0;
            
    }
    
    var _Game_Picture_updateMove = Game_Picture.prototype.updateMove;
    Dice_Picture.prototype.updateMove = function() {
        if ( this._durations.length > 0 && this._durations[this._move_index] > 0) {
            var d = this._durations[this._move_index];
            this._x = (this._x * (d - 1) + this._target_xs[this._move_index]) / d;
            this._y = (this._y * (d - 1) + this._target_ys[this._move_index]) / d;
            this._scaleX  = (this._scaleX  * (d - 1) + this._targetScaleX)  / d;
            this._scaleY  = (this._scaleY  * (d - 1) + this._targetScaleY)  / d;
            this._opacity = (this._opacity * (d - 1) + this._target_opacities[this._move_index]) / d;
            this._durations[this._move_index]--;
            if(this._durations[this._move_index] <= 0) {
                this._durations.shift();
                this._target_xs.shift();
                this._target_ys.shift();
                this._target_opacities.shift();
            }
    
        }
        else {
            _Game_Picture_updateMove.call(this);
        }
    };
    
    Game_Screen.prototype.showDice = function(pictureId, origin, x, y,
                                                 scaleX, scaleY, opacity, blendMode) {
        this._dice_pictures = [];
        for(var i=0; i<6; i++) {
            var realPictureId = this.realPictureId(pictureId + i);
            var name = "dice_" + String(i+1);
            this._dice_pictures[i] = new Dice_Picture();
            this._dice_pictures[i].show(name, 0, x, y, 100, 100, 0, 0);
            this._pictures[realPictureId] = this._dice_pictures[i];
        }
        this._dice_index = 0;
        this._dice_throwing = false;
    };
    
    Array.prototype.shuffle = function() {
          return this.map(function(a){return [a, Math.random()]})
                     .sort(function(a, b){return a[1] - b[1]})
                     .map(function(a){return a[0]});
    }
    Game_Screen.prototype.throwDice = function(target_x, target_y) {
        this._dice_throwing = true;
        var shuffle_val = [1, 2, 3, 4, 5, 6].shuffle();
        var final_value    = shuffle_val[0]
        $gameVariables.setValue(variables_index, final_value);
        var throwing_val_1 = shuffle_val[1];
        var throwing_val_2 = shuffle_val[2];
        var throwing_val_3 = shuffle_val[3];
        for(var i=0; i<6; i++) {
            var tmp = [];
            var x = this._dice_pictures[this._dice_index].x();
            var y = this._dice_pictures[this._dice_index].y();
            if( (i+1)==throwing_val_1 ) { 
                tmp.push({_duration:1, _target_x:x, _target_y:y, _target_opacity:255});
                tmp.push({_duration:6, _target_x:x-20, _target_y:y-150, _target_opacity:255});
                tmp.push({_duration:8, _target_x:x-40, _target_y:y-180, _target_opacity:255});
            } else {
                tmp.push({_duration:1, _target_x:x, _target_y:y, _target_opacity:0});
                tmp.push({_duration:6, _target_x:x-20, _target_y:y-150, _target_opacity:0});
                tmp.push({_duration:8, _target_x:x-40, _target_y:y-180, _target_opacity:0});
            }
            if( (i+1)==throwing_val_2 ) { 
                tmp.push({_duration:1, _target_x:x-40, _target_y:y-180, _target_opacity:255});
                tmp.push({_duration:10, _target_x:x-60, _target_y:y-150, _target_opacity:255});
                tmp.push({_duration:10, _target_x:x-80, _target_y:y-80, _target_opacity:255});
            } else {
                tmp.push({_duration:1, _target_x:x-40, _target_y:y-180, _target_opacity:0});
                tmp.push({_duration:10, _target_x:x-60, _target_y:y-150, _target_opacity:0});
                tmp.push({_duration:10, _target_x:x-80, _target_y:y-80, _target_opacity:0});
            }
            if( (i+1)==throwing_val_3 ) { 
                tmp.push({_duration:1, _target_x:x-80, _target_y:y-80, _target_opacity:255});
                tmp.push({_duration:8, _target_x:x-100, _target_y:y-140, _target_opacity:255});
                tmp.push({_duration:8, _target_x:x-110, _target_y:y-160, _target_opacity:255});
            } else {
                tmp.push({_duration:1, _target_x:x-80, _target_y:y-80, _target_opacity:0});
                tmp.push({_duration:8, _target_x:x-100, _target_y:y-140, _target_opacity:0});
                tmp.push({_duration:8, _target_x:x-110, _target_y:y-160, _target_opacity:0});
            }
            if( (i+1)==final_value ) { 
                tmp.push({_duration:1, _target_x:x-110, _target_y:y-160, _target_opacity:255});
                tmp.push({_duration:8, _target_x:x-120, _target_y:y-140, _target_opacity:255});
            } else {
                tmp.push({_duration:1, _target_x:x-110, _target_y:y-160, _target_opacity:0});
                tmp.push({_duration:8, _target_x:x-120, _target_y:y-140, _target_opacity:0});
            }
    
            this._dice_pictures[i].setMoves(tmp);
        }
    };
    
    var _Game_Screen_updatePictures = Game_Screen.prototype.updatePictures;
    Game_Screen.prototype.updatePictures = function() {
        if( this._dice_pictures && !this._dice_throwing) {
            var x = this._dice_pictures[this._dice_index].x();
            var y = this._dice_pictures[this._dice_index].y();
            this._dice_pictures[this._dice_index].move(0, x, y, 100, 100, 0, 0, 1);
            this._dice_index++;
            if(this._dice_index >= 6){
                this._dice_index = 0;
            }
            this._dice_pictures[this._dice_index].move(0, x, y, 100, 100, 255, 0, 1);
        }
        _Game_Screen_updatePictures.call(this);
      
    };

})();

