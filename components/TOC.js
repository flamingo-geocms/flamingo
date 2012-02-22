/* 
 * Copyright (C) 2012 B3Partners B.V.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Overview component
 * Creates a overview map
 * @author <a href="mailto:meinetoonen@b3partners.nl">Meine Toonen</a>
 */
Ext.define ("viewer.components.TOC",{
    extend: "viewer.components.Component",
    panel: null,
    selectedContent : null,
    appLayers :  null,
    service : null,
    levels : null,
    checkClicked : false,
    config: {
        groupCheck:true,
        layersChecked:true,
        showBaselayers:true,
        title: "Table of Contents"
    },
    constructor: function (config){
        viewer.components.TOC.superclass.constructor.call(this, config);
        this.initConfig(config);        
        this.selectedContent = this.viewerController.app.selectedContent,
        this.appLayers = this.viewerController.app.appLayers,
        this.levels = this.viewerController.app.levels,
        this.services = this.viewerController.app.services,
        this.loadTree();
        this.loadInitLayers();
        this.viewerController.mapComponent.getMap().registerEvent(viewer.viewercontroller.controller.Event.ON_LAYER_VISIBILITY_CHANGED,this.syncLayers,this);
        return this;
    },
    loadTree : function(){
        Ext.QuickTips.init();
        var store = Ext.create('Ext.data.TreeStore', {
            root: {
                text: 'Root',
                expanded: true,
                checked: false,
                children: []
            }
        });
        this.panel =Ext.create('Ext.tree.Panel', {
            renderTo: this.div,
            title: this.title,
            height: "100%",
            useArrows: true,
            rootVisible: false,
            floating: false,
            listeners:{
                itemclick:{
                    toc: this,
                    fn: this.itemClicked,
                    scope: this
                },
                checkchange:{
                    toc: this,
                    fn: this.checkboxClicked,
                    scope: this
                }
            },
            store: store
        });
    },
    loadInitLayers : function(){
        var nodes = new Array();
        for ( var i = 0 ; i < this.selectedContent.length ; i ++){
            var contentItem = this.selectedContent[i];
            if(contentItem.type ==  "level"){
                var level = this.addLevel(contentItem.id);
                if(level != null){
                    nodes.push(level);
                }
            }else if(contentItem.type == "appLayer"){
                var layer = this.addLayer(contentItem.id);
                nodes.push(layer);
            }
        }
        this.insertLayer(nodes);
    },
    addLevel : function (levelId){
        var nodes = new Array();
        var level = this.levels[levelId];
        if(level.background && !this.showBaselayers ){
            return null;
        }
        var treeNodeLayer = {
            text: level.name, 
            id: level.id,
            expanded: true,
            leaf: false,
            layerObj: {
                serviceId: level.id
            }
        };
        if(this.groupCheck){
            treeNodeLayer.checked=  false; // Todo: find children checkboxes
        }
        if(level.info != undefined){
            treeNodeLayer.qtip= "Informatie over de kaart";
            treeNodeLayer.layerObj.info = level.info;
        }
        
        if(level.children != undefined ){
            for(var i = 0 ; i < level.children.length; i++){
                var l = this.addLevel(level.children[i]);
                if(l != null){
                    nodes.push(l);
                }
            }
        }
        
        if(level.layers != undefined ){
            for(var j = 0 ; j < level.layers.length ; j ++){
                nodes.push(this.addLayer(level.layers[j]));
            }
        }
        
        treeNodeLayer.children= nodes;
        return treeNodeLayer;
    },
    
    addLayer : function (layerId){
        var appLayerObj = this.appLayers[layerId];
        var service = this.services[appLayerObj.serviceId];
        var serviceLayer = service.layers[appLayerObj.layerName];
        var layerTitle = this.viewerController.getLayerTitle(service.id, appLayerObj.layerName); // TODO: Search title
        var treeNodeLayer = {
            text: layerTitle,
            id: appLayerObj.id,
            expanded: true,
            leaf: true,
            layerObj: {
                service: service.id,
                layerName : appLayerObj.layerName
            }
        };
        if(serviceLayer.details != undefined && serviceLayer.details ["metadata.stylesheet"] != undefined){
            treeNodeLayer.qtip= "Metadata voor de kaartlaag";
            treeNodeLayer.layerObj.metadata = serviceLayer.details ["metadata.stylesheet"];
        }
        if(this.layersChecked){
            treeNodeLayer.checked = appLayerObj.checked;
        }
        return treeNodeLayer;        
    },
    insertLayer : function (config){
        var root = this.panel.getRootNode();
        root.appendChild(config);
        root.expand()
    },
    selectLayers : function (layers,checked){
        for(var i = 0 ; i< layers.length;i++){
            this.selectLayer(layers[i],checked);
        }
    },
    selectLayer : function (layer,checked){
        var node = this.panel.getStore().getNodeById(layer);
        if(node != null){
            if( node.data.checked != checked){
                node.data.checked= checked;
                if(node.raw != undefined){
                    node.raw.checked = checked;
                }
                this.checkboxClicked (node,checked,this);
                node.updateInfo();
            }
        }
    },
    
    getAppLayerId : function (name){
        for ( var i in this.appLayers){
            var appLayer = this.appLayers[i];
            if(appLayer.layerName== name){
                return appLayer.id;
            }
        }
        return null;
    },
    /*************************  Event handlers ***********************************************************/
    syncLayers : function (map,object){
        var layer = object.layer;
        var visible = object.visible;
        var id = this.getAppLayerId(layer.id);
        this.selectLayer (id,visible);
    },
    checkboxClicked : function(nodeObj,checked,toc){
        this.checkClicked= true;
        if(nodeObj.isLeaf()){
            var node = nodeObj.raw;
            if(node ===undefined){
                node = nodeObj.data;
            }
            var layer = node.layerObj;
    
            if(checked){
                this.viewerController.setLayerVisible(layer.service, layer.layerName, true);
            }else{
                this.viewerController.setLayerVisible(layer.service, layer.layerName, false);
            }
        }
    },
    itemClicked: function(thisObj, record, item, index, e, eOpts){
        if(this.checkClicked){
            this.checkClicked =false;
            return
        }
        // TODO don't fire when checkbox is clicked
        var node = record.raw;
        if(node ===undefined){
            node = record.data;
        }
        var layerName = node.text;
        if(node.leaf){
            if(node.layerObj.metadata!= undefined){
                Ext.Msg.alert('Metadata', node.layerObj.metadata);
            }
        }else if(!node.leaf){
            if(node.layerObj.info!= undefined){
                Ext.Msg.alert('Info', node.layerObj.info);
            }
        }
    }
});
