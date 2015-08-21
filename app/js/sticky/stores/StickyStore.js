"use strict";

var assign = require('object-assign');
var AppDispatcher = require('../../dispatcher/AppDispatcher');
var StickyConst = require('../constants/StickyConst');

// Stores
var AppStore = require('../../app/stores/AppStore');
var ColAndRowStore = require('../../colAndRow/stores/ColAndRowStore');

var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

//TODO store stickyes []
var stickies = [];

var _onSelectItem = function (e, node) {

    var domNode = node.getDOMNode();
    //Change the mouse cursor
    domNode.className += " grabbing";

};

var _onDeselectItem = function (e, node) {
    if (node) {
        var domNode = node.getDOMNode();
        //todo update attr cellCol & cellRow of the given sticky
        
        var cell = ColAndRowStore.getColumnAndRow(e.clientX, e.clientY);
        node.props.sticky.cell_column = cell.x;
        node.props.sticky.cell_row = cell.y;
        StickyStore.positionSticky(node.props.sticky);
        if (domNode.className.replace) {
            domNode.className = domNode.className.replace("grabbing", "");
        }
    }
};


var StickyStore = assign({}, EventEmitter.prototype, {

    getStickies: function(){
        return stickies;
    },

    _setStickies: function(stickiesArray){
        stickies = stickiesArray;
    },

    init: function(model){
        this._setStickies(model.stickies);
        this._initPositionStickies();
    },

    _initPositionStickies: function(){
        _.each(stickies, function(sticky){
            sticky.position = ColAndRowStore.getPositionXY(sticky.cell_column, sticky.cell_row);
        });
    },

    addChangeListener: function (callback) {
        this.on(StickyConst.CHANGE, callback);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function () {
        this.removeListener(StickyConst.CHANGE);
    },

    emitChange: function (e) {
        this.emit(StickyConst.CHANGE, e);
    },

    addChangePositionListener: function(callback){
        this.on(StickyConst.CHANGE_POSITION, callback);
    },

    removeChangePositionListener: function(){
        this.removeListener(StickyConst.CHANGE_POSITION);
    },

    emitChangePosition: function(e){
        this.emit(StickyConst.CHANGE_POSITION, e);
    },

    findStickyById: function(id){
        return _.find(stickies, function(sticky){
            return sticky.content.id === id;
        });
    },

    getAllStickiesForACell: function(column, row){
        var arrayStickies = [];

        _.each(stickies, function(sticky){
            if(sticky.cell_column === column && sticky.cell_row === row){
                arrayStickies.push(sticky);
            }
        });

        return arrayStickies;
    },

    positionSticky: function(sticky){
        sticky.position = ColAndRowStore.getPositionXY(sticky.cell_column, sticky.cell_row);

        if(_.isNull(sticky.position)){
            this._positionStickyBacklog();
        }else{
            this._positionStickyInCell(sticky);
        }
    },

    _positionStickyInCell: function(sticky){

        var stickiesInCell = this.getAllStickiesForACell(sticky.cell_column, sticky.cell_row);

        if(stickiesInCell.length > StickyConst.MAX_STICKIES_IN_CELL){
            this._collapeAllStickies(stickiesInCell, sticky.position);
        }else{
            this._arrangeStickies(stickiesInCell, sticky);
        }
    },

    _collapeAllStickies: function(arrayStickies, position){
        var y = position.y;
        _.each(arrayStickies, function(sticky){
            sticky.position.y = y;
            y += 5;
        });
        this.emitChangePosition();
    },

    _arrangeStickies: function(arrayStickies, sticky){
        var index = _.findIndex(arrayStickies, function(s){
            return sticky.content.id === s.content.id;
        });
        sticky.position.y += index*(Constants.STICKY.HEIGHT + Constants.STICKY.SPACE_BETWEEN);
        this.emitChangePosition();
    },

    _positionStickyBacklog: function(){

    }

});

AppStore.addStore(StickyStore);

// Register callback to handle all updates
AppDispatcher.register(function (action) {

    switch (action.actionType) {

        case StickyConst.SELECT :
            _onSelectItem(action.event, action.node);
            break;

        case StickyConst.DESELECT:
            _onDeselectItem(action.event, action.node);
            break;

    }
});

module.exports = StickyStore;