import { Range } from 'manifesto.js';
import { MetadataComponent } from '@iiif/iiif-metadata-component';
import { UriLabeller } from '@iiif/manifold';
import { BaseEvents } from "../uv-shared-module/BaseEvents";
import { RightPanel } from "../uv-shared-module/RightPanel";
import { UVUtils } from "../../Utils";

export class MoreInfoRightPanel extends RightPanel {

    metadataComponent: any;
    $metadata: JQuery;
    limitType: any;
    limit: number;

    constructor($element: JQuery) {
        super($element);
    }

    create(): void {

        this.setConfig('moreInfoRightPanel');

        super.create();
        
        this.component.subscribe(BaseEvents.CANVAS_INDEX_CHANGED, () => {
            this.databind();
        });

        this.component.subscribe(BaseEvents.RANGE_CHANGED, () => {
            this.databind();
        });

        this.setTitle(this.config.content.title);

        this.$metadata = $('<div class="iiif-metadata-component"></div>');
        this.$main.append(this.$metadata);

        this.metadataComponent = new MetadataComponent({
            target:  <HTMLElement>this.$metadata[0],
            data: this._getData()
        });

        this.metadataComponent.on('iiifViewerLinkClicked', (href: string) => {
            // get the hash param.
            const rangeId: string | null = Utils.Urls.getHashParameterFromString('rid', href);
            const rawTime: string | null = Utils.Urls.getHashParameterFromString('t', href);
            const time: number | null = rawTime ? parseInt(rawTime, 10) : null;
            const canvasId: string | null = Utils.Urls.getHashParameterFromString('c', href);

            // First change canvas id.
            if (canvasId) {
                const canvasIndex: number | null = this.extension.helper.getCanvasIndexById(canvasId);

                if (canvasIndex) {
                    this.component.publish(BaseEvents.CANVAS_INDEX_CHANGED, [canvasIndex]);
                }
            }

            if (rangeId) {
                const range: Range | null = this.extension.helper.getRangeById(rangeId);

                if (range) {
                    this.component.publish(BaseEvents.RANGE_CHANGED, range);
                }
            }

            // Finally change timestamp.
            if (time !== null) {
                // @todo validate time? Validation should probably be part of extension.helper.
                this.component.publish(BaseEvents.CURRENT_TIME_CHANGED, [time]);
            }

        }, false);
    }

    toggleFinish(): void {
        super.toggleFinish();
        this.databind();
    }

    databind(): void {
        this.metadataComponent.set(this._getData());
    }

    private _getCurrentRange(): Range | null {
        return this.extension.helper.getCurrentRange();
    }

    private _getData() {
        return {
            canvasDisplayOrder: this.config.options.canvasDisplayOrder,
            canvases: this.extension.getCurrentCanvases(),
            canvasExclude: this.config.options.canvasExclude,
            canvasLabels: this.extension.getCanvasLabels(this.content.page),
            content: this.config.content,
            copiedMessageDuration: 2000,
            copyToClipboardEnabled: Utils.Bools.getBool(this.config.options.copyToClipboardEnabled, false),
            helper: this.extension.helper,
            licenseFormatter: new UriLabeller(this.config.license ? this.config.license : {}),
            limit: this.config.options.textLimit || 4,
            limitType: 'lines',
            limitToRange: Utils.Bools.getBool(this.config.options.limitToRange, false),
            manifestDisplayOrder: this.config.options.manifestDisplayOrder,
            manifestExclude: this.config.options.manifestExclude,
            range: this._getCurrentRange(),
            rtlLanguageCodes: this.config.options.rtlLanguageCodes,
            sanitizer: (html: string) => {
                return UVUtils.sanitize(html);
            },
            showAllLanguages: this.config.options.showAllLanguages
        };
    }

    resize(): void {
        super.resize();

        this.$main.height(this.$element.height() - this.$top.height() - this.$main.verticalMargins());
    }
}
