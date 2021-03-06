/* global log, Modules */

define(['../entity/character/character'], function(Character) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;
            self.camera = game.getCamera();
            self.renderer = game.renderer;
            self.input = game.input;
            self.sprites = null;
        },

        update: function() {
            this.timeDifferential = (new Date() - this.lastUpdate) / 1000;

            this.animateTiles();
            this.updateEntities();
            this.input.updateCursor();
            this.updateKeyboard();
            this.updateAnimations();
            this.verifyScale();
            this.updateInfos();
            this.updateBubbles();

            this.lastUpdate = new Date();
        },

        animateTiles: function() {
            var self = this,
                time = self.game.time;

            self.renderer.forEachAnimatedTile(function(tile) {
                if (tile.animate(time)) {
                    tile.isDirty = true;
                    tile.dirtyRect = self.renderer.getTileBounds(tile);
                }
            });
        },

        updateEntities: function() {
            var self = this;

            self.game.entities.forEachEntity(function(entity) {
                if (entity.spriteLoaded)
                    self.updateFading(entity);

                var animation = entity.currentAnimation;

                if (animation)
                    animation.update(self.game.time);

                if (entity.type === 'projectile') {
                    var mDistance = entity.speed * self.timeDifferential,
                        dx = entity.destX - entity.x,
                        dy = entity.destY - entity.y,
                        tDistance = Math.sqrt(dx * dx + dy * dy),
                        amount = mDistance / tDistance;

                    if (amount > 1)
                        amount = 1;

                    entity.x += dx * amount;
                    entity.y += dy * amount;

                    /**
                     * Prevents bug where the arrow becomes
                     * lodged into the target without de-spawning.
                     */

                    if (tDistance < 5)
                        entity.impact();

                    return;
                }

                if (entity.movement && entity.movement.inProgress)
                    entity.movement.step(self.game.time);

                if (entity instanceof Character && entity.hasPath() && !entity.movement.inProgress) {
                    var tick = Math.round(266 / entity.movementSpeed);

                    switch (entity.orientation) {
                        case Modules.Orientation.Left:

                            entity.movement.start(self.game.time,
                                function(x) {
                                    entity.x = x;
                                    entity.moved();
                                },
                                function() {
                                    entity.x = entity.movement.endValue;
                                    entity.moved();
                                    entity.nextStep();
                                },
                                entity.x - tick,
                                entity.x - 16,
                                entity.movementSpeed);

                            break;

                        case Modules.Orientation.Right:

                            entity.movement.start(self.game.time,
                                function(x) {
                                    entity.x = x;
                                    entity.moved();
                                },
                                function() {
                                    entity.x = entity.movement.endValue;
                                    entity.moved();
                                    entity.nextStep();
                                },
                                entity.x + tick,
                                entity.x + 16,
                                entity.movementSpeed);

                            break;

                        case Modules.Orientation.Up:

                            entity.movement.start(self.game.time,
                                function(y) {
                                    entity.y = y;
                                    entity.moved();
                                },
                                function() {
                                    entity.y = entity.movement.endValue;
                                    entity.moved();
                                    entity.nextStep();
                                },
                                entity.y - tick,
                                entity.y - 16,
                                entity.movementSpeed);

                            break;

                        case Modules.Orientation.Down:

                            entity.movement.start(self.game.time,
                                function(y) {
                                    entity.y = y;
                                    entity.moved();
                                },
                                function() {
                                    entity.y = entity.movement.endValue;
                                    entity.moved();
                                    entity.nextStep();
                                },
                                entity.y + tick,
                                entity.y + 16,
                                entity.movementSpeed);

                            break;
                    }
                }

            });
        },

        updateFading: function(entity) {
            var self = this;

            if (!entity || !entity.fading || entity.type === 'projectile')
                return;

            var duration = 1000,
                time = self.game.time,
                dt = time - entity.fadingTime;

            if (dt > duration) {
                entity.isFading = false;
                entity.fadingAlpha = 1;
            } else
                entity.fadingAlpha = dt / duration;
        },

        updateKeyboard: function() {
            var self = this,
                player = self.game.player,
                position = {
                    x: player.gridX,
                    y: player.gridY
                };

            if (player.frozen)
                return;

            if (player.direction === 'up')
                position.y--;
            else if (player.direction === 'down')
                position.y++;
            else if (player.direction === 'right')
                position.x++;
            else if (player.direction === 'left')
                position.x--;

            if (player.direction)
                self.input.keyMove(position);

        },

        updateAnimations: function() {
            var self = this,
                target = self.input.targetAnimation;

            if (target)
                target.update(self.game.time);

            if (!self.sprites)
                return;

            var sparks = self.sprites.sparksAnimation;

            if (sparks)
                sparks.update(self.game.time);
        },

        verifyScale: function() {
            var self = this,
                scale = self.renderer.getDrawingScale();

            if (self.renderer.tileset && self.renderer.tileset.scale !== scale)
                self.game.map.updateTileset();

        },

        updateInfos: function() {
            if (this.game.info)
                this.game.info.update(this.game.time);
        },

        updateBubbles: function() {
            if (this.game.bubble)
                this.game.bubble.update(this.game.time);

            if (this.game.pointer)
                this.game.pointer.update();
        },

        setSprites: function(sprites) {
            this.sprites = sprites;
        }

    });

});