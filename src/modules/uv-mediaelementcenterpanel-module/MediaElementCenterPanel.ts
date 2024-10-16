import {BaseEvents} from "../uv-shared-module/BaseEvents";
import {Events} from "../../extensions/uv-mediaelement-extension/Events";
import {CenterPanel} from "../uv-shared-module/CenterPanel";
import {IMediaElementExtension} from "../../extensions/uv-mediaelement-extension/IMediaElementExtension";
import { UVUtils } from "../../Utils";
import { AnnotationBody, Canvas, IExternalResource, Rendering } from 'manifesto.js';
import { MediaType } from '@iiif/vocabulary';

export class MediaElementCenterPanel extends CenterPanel {

    $container: JQuery;
    $media: JQuery;
    mediaHeight: number;
    mediaWidth: number;
    player: any;
    title: string | null;

    constructor($element: JQuery) {
        super($element);
    }

    create(): void {

        this.setConfig('mediaelementCenterPanel');

        super.create();

        const that = this;

        // events.

        // only full screen video
        // if (this.isVideo()){
        //     this.component.subscribe(BaseEvents.TOGGLE_FULLSCREEN, () => {
        //         if (that.component.isFullScreen) {
        //             that.player.enterFullScreen(false);
        //         } else {
        //             that.player.exitFullScreen(false);
        //         }
        //     });
        // }

        this.component.subscribe(BaseEvents.OPEN_EXTERNAL_RESOURCE, (resources: IExternalResource[]) => {
            that.openMedia(resources);
        });

        this.$container = $('<div class="container"></div>');
        this.$content.append(this.$container);

        this.title = this.extension.helper.getLabel();

    }

    openMedia(resources: IExternalResource[]) {

        const that = this;

        this.extension.getExternalResources(resources).then(() => {

            this.$container.empty();

            const canvas: Canvas = this.extension.helper.getCurrentCanvas();

            this.mediaHeight = this.config.defaultHeight;
            this.mediaWidth = this.config.defaultWidth;

            this.$container.height(this.mediaHeight);
            this.$container.width(this.mediaWidth);

            const poster: string = (<IMediaElementExtension>this.extension).getPosterImageUri();
            const sources: any[] = [];

            const renderings: Rendering[] = canvas.getRenderings();
            
            if (renderings && renderings.length) {
                canvas.getRenderings().forEach((rendering: Rendering) => {
                    sources.push({
                        type: rendering.getFormat().toString(),
                        src: rendering.id
                    });
                });
            } else {
                const formats: AnnotationBody[] | null = this.extension.getMediaFormats(this.extension.helper.getCurrentCanvas());

                if (formats && formats.length) {
                    formats.forEach((format: AnnotationBody) => {
                        
                        const type: MediaType | null = format.getFormat();

                        if (type) {
                            sources.push({
                                type: type.toString(),
                                src: format.id
                            });
                        }
                        
                    });
                }
            }

            if (this.isVideo()) {

                this.$media = $('<video controls="controls" preload="none"></video>');
                this.$container.append(this.$media);

                this.player = new MediaElementPlayer($('video')[0], {
                    //pluginPath: this.extension.data.root + 'lib/mediaelement/',
                    poster: poster,
                    features: ['playpause', 'current', 'progress', 'volume'],
                    success: function(mediaElement: any, originalNode: any) {
                        
                        mediaElement.addEventListener('canplay', () => {
                            that.resize();
                        });

                        mediaElement.addEventListener('play', () => {
                            that.component.publish(Events.MEDIA_PLAYED, Math.floor(mediaElement.currentTime));
                        });

                        mediaElement.addEventListener('pause', () => {
                            // mediaelement creates a pause event before the ended event. ignore this.
                            if (Math.floor(mediaElement.currentTime) != Math.floor(mediaElement.duration)) {
                                that.component.publish(Events.MEDIA_PAUSED, Math.floor(mediaElement.currentTime));
                            }
                        });

                        mediaElement.addEventListener('ended', () => {
                            that.component.publish(Events.MEDIA_ENDED, Math.floor(mediaElement.duration));
                        });

                        mediaElement.setSrc(sources);
                    }
                });

                // prevents errors when entering/exiting full screen
                this.player.fullscreenBtn = {};
                this.player.fullscreenBtn.classList = {};
                this.player.fullscreenBtn.classList.add = () => {};
                this.player.fullscreenBtn.classList.remove = () => {};

            } else { // audio

                this.$media = $('<audio controls="controls" preload="none"></audio>');
                this.$container.append(this.$media);

                this.player = new MediaElementPlayer($('audio')[0], {
                    poster: poster,
                    defaultAudioWidth: 'auto',
                    defaultAudioHeight: 'auto',
                    showPosterWhenPaused: true,
                    showPosterWhenEnded: true,
                    success: function(mediaElement: any, originalNode: any) {
                        
                        mediaElement.addEventListener('canplay', () => {
                            that.resize();
                        });

                        mediaElement.addEventListener('play', () => {
                            that.component.publish(Events.MEDIA_PLAYED, Math.floor(mediaElement.currentTime));
                        });

                        mediaElement.addEventListener('pause', () => {
                            // mediaelement creates a pause event before the ended event. ignore this.
                            if (Math.floor(mediaElement.currentTime) != Math.floor(mediaElement.duration)) {
                                that.component.publish(Events.MEDIA_PAUSED, Math.floor(mediaElement.currentTime));
                            }
                        });

                        mediaElement.addEventListener('ended', () => {
                            that.component.publish(Events.MEDIA_ENDED, Math.floor(mediaElement.duration));
                        });

                        mediaElement.setSrc(sources);
                    }
                });
            }

            this.resize();
        });
    }

    isVideo(): boolean {
        return (<IMediaElementExtension>this.extension).isVideo();
    }

    resize() {

        super.resize();

        // if in Firefox < v13 don't resize the media container.
        if (window.browserDetect.browser === 'Firefox' && window.browserDetect.version < 13) {
            this.$container.width(this.mediaWidth);
            this.$container.height(this.mediaHeight);
        } else {
            // fit media to available space.
            const size: Utils.Size = Utils.Dimensions.fitRect(this.mediaWidth, this.mediaHeight, this.$content.width(), this.$content.height());

            this.$container.height(size.height);
            this.$container.width(size.width);

            if (this.player && !this.extension.isFullScreen()) {
                this.$media.width(size.width);
                this.$media.height(size.height);
            }
        }

        const left: number = Math.floor((this.$content.width() - this.$container.width()) / 2);
        const top: number = Math.floor((this.$content.height() - this.$container.height()) / 2);

        this.$container.css({
            'left': left,
            'top': top
        });

        if (this.title) {
            this.$title.text(UVUtils.sanitize(this.title));
        }

        if (this.player) {

            this.player.setPlayerSize();
            this.player.setControlsSize();

            const $mejs: JQuery = $('.mejs__container');

            // if (!this.component.isFullScreen) {
            $mejs.css({
                'margin-top': (this.$container.height() - $mejs.height()) / 2
            });
            // }
            
            // if (!this.isVideo() || (this.isVideo() && !this.component.isFullScreen)) {
            //     this.player.setPlayerSize();
            //     this.player.setControlsSize();

            //     const $mejs: JQuery = $('.mejs__container');

            //     $mejs.css({
            //         'margin-top': (this.$container.height() - $mejs.height()) / 2
            //     });
            // }

        }
        
    }
}
