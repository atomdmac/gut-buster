define([
    'phaser',
    'game-sprite'
], function (Phaser, GameSprite) { 
    'use strict';

    //From http://www.gamedevacademy.org/html5-phaser-tutorial-top-down-games-with-tiled/
    //find objects in a Tiled layer that containt a property called "type" equal to a certain value
    function findObjectsByType (type, map, layer) {
        var result = new Array();

        // If layer doesn't exist, return an empty array.
        if(!map.objects[layer]) return result;

        map.objects[layer].forEach(function(element) {
            if (element.type === type) {
                //Phaser uses top left, Tiled bottom left so we have to adjust the y position
                //also keep in mind that the cup images are a bit smaller than the tile which is 16x16
                //so they might not be placed in the exact pixel position as in Tiled
                console.log("Found " + element.name);
                // element.y -= element.height;
                result.push(element);
            }
        });
        return result;
    }

    //create a sprite from an object
    function createFromTiledObject (game, element, customClass) {
        var CustomClass = customClass || GameSprite,
            frame = parseInt(element.properties.frame),
            sprite = new CustomClass(game, element.x, element.y, element.properties.key || null, frame, element.properties);

        // Copy all properties to the sprite
        Object.keys(element).forEach(function(key) {
            sprite[key] = element[key];
        });
        return sprite;
    }

    function createObjectsByType(game, type, map, layer, customClass, group) {
        var results = findObjectsByType(type, map, layer);
        group = group || game.add.group();

        // If no objects matching the specified criteria could be found, return
        // an empty group.
        if(!results.length) return group;

        results.forEach(function (element) {
            group.add(createFromTiledObject(game, element, customClass));
        });
        return group;
    }

    function createObjectByName(game, name, map, layer, customClass) {
        var obj;
        map.objects[layer].forEach(function(element) {
            if (element.name === name) {
                //Phaser uses top left, Tiled bottom left so we have to adjust the y position
                //also keep in mind that the cup images are a bit smaller than the tile which is 16x16
                //so they might not be placed in the exact pixel position as in Tiled
                console.log("Found " + element.name);
                // element.y -= element.height;
                obj = createFromTiledObject(game, element, customClass);
                return false;
            }
        });
        return obj;
    }

    return {
        createObjectByName: createObjectByName,
        createObjectsByType: createObjectsByType
    };

});