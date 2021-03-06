/* 
 * Copyright (C) 2019 B3Partners B.V.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


/* global Ext */

Ext.define("viewer.viewercontroller.ol.tools.NextExtent", {

    constructor: function (conf) {
        this.initConfig(conf);
    },

    activate: function () {
        if (this.viewerController.mapComponent.historyExtents.index < this.viewerController.mapComponent.historyExtents.extents.length - 1) {
            var frameworkMap = this.viewerController.mapComponent.getMap().frameworkMap;
            this.viewerController.mapComponent.historyExtents.update = false;
            this.viewerController.mapComponent.historyExtents.index++;
            frameworkMap.getView().setCenter(this.viewerController.mapComponent.historyExtents.extents[this.viewerController.mapComponent.historyExtents.index].center);
            frameworkMap.getView().setResolution(this.viewerController.mapComponent.historyExtents.extents[this.viewerController.mapComponent.historyExtents.index].resolution);
        }
    },

    deactivate: function () {
        // tool kan niet uitgezet worden.
    },

    isActive: function () {
        return false;
    }
});