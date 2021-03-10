/**
 * Created by mkottmann on 10.03.21.
 */

import {LightningElement, api, track, wire} from 'lwc';
import getContentVersions from '@salesforce/apex/FileManagerService.getContentVersions';
import { NavigationMixin} from 'lightning/navigation';

const columns = [
    {
        label: 'Title',
        fieldName: 'Title',
        wrapText: true,
        cellAttributes: {
            iconName: {
                fieldName: 'icon'
            },
            iconPosition:'left'
        }
    },
    {
        label: 'Created By',
        fieldName: 'CREATED_BY',
        cellAttributes: {
            iconName: 'standard:user',
            iconPosition:'left'
        }
    },
    {
        label: 'File Size',
        fieldName: 'Size'
    },
    {
        label: 'Preview',
        type: 'button',
        initialWidth: "30",
        typeAttributes: {
            alternativeText: 'Preview',
            name: 'Preview',
            iconName: 'utility:preview'
        }
    },
    {
        label: 'Download',
        type: 'button',
        initialWidth: "30",
        typeAttributes: {
            alternativeText: 'Download',
            name: 'Download',
            iconName: 'action:download'
        }
    }/*,
    {
        label: 'Delete',
        type: 'button',
        typeAttributes: {
            label: 'Delete',
            name: 'Delete',
            variant: 'destructive',
            iconName: 'standard:record_delete',
            iconPosition:'right'
        }
    }*/
];

export default class FileManager extends LightningElement {
    @api recordId;
    @api title;
    @api showUpload;
    @api isCommunity;
    @api showFilters;
    @api filterByOwner;

    @track dataList;
    @track columnsList = columns;
    isLoading = false;

    getBaseURL(){
        let baseUrl = 'https://' + location.host + '/';
        return baseUrl;
    }

    connectedCallback() {
        this.handleSync();
    }

    handleRowAction( event ){
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        console.log('handleRowAction');

        console.log(event);
        switch (actionName){
            case 'Preview':
                this.previewFile(row);
                break;
            case 'Download':
                this.downloadFile(row);
                break;
            case 'Delete':
                // this.deleteFile(row); TODO
                break;
            default:
        }
    }

    previewFile(file){
        console.log(file);
        if(!this.isCommunity){
            this[NavigationMixin.Navigate](
                {type:'standard__namedPage',
                    attributes: {pageName: filePreview},
                    state: {selectedRecordId: file.ContentDocumentId}
                });
        }
        else if(this.isCommunity){
            this[NavigationMixin.Navigate](
                {type:'standard__webPage',
                    attributes: {url: file.fileUrl}
                }, false);
        }
    }

    downloadFile(file){
        console.log(file);
        this[NavigationMixin.Navigate](
            {type:'standard__webPage',
                attributes: {url: file.downloadUrl}
            }, false);
    }


    handleSync(){
        this.isLoading = true;

        let imageExtensions = ['png', 'jpg', 'gif', 'image'];
        let supportedIconExtensions = ['ai', 'attachment', 'audio' , 'box_notes', 'csv', 'eps', 'excel', 'exe' , 'flash',
        'folder', 'gdoc', 'gdocs', 'gform', 'gpres', 'gsheet', 'html', 'keynote', 'library_folder', 'link', 'mp4', 'overlay',
        'pack', 'pages', 'pdf', 'ppt', 'psd', 'quip_doc', 'quip_sheet', 'quip_slide', 'rtf', 'slide', 'stypi', 'txt', 'unknown',
        'video', 'visio', 'webex', 'word', 'xml', 'zip'];

        getContentVersions({recordId: this.recordId, filterByCustomPermission: this.filterByOwner})
            .then(result => {
                let baseUrl = this.getBaseURL();
                let parsedData = JSON.parse(result);
                let stringifiedData = JSON.stringify(parsedData);
                let finalData = JSON.parse(stringifiedData);
                finalData.forEach(file => {
                    file.downloadUrl = baseUrl + 'sfc/servlet.shepherd/document/download/' + file.ContentDocumentId;
                    console.log(file.downloadUrl);
                    file.fileUrl = baseUrl + 'sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=' + file.Id;
                    console.log(file.fileUrl);
                    file.CREATED_BY = file.ContentDocument.CreatedBy.Name;
                    file.Size = this.formatSize(file.ContentDocument.ContentSize, 2);

                    let fileType = file.ContentDocument.FileType.toLowerCase();
                    if(imageExtensions.includes(fileType)){
                        file.icon = 'doctype:image';
                    }else{
                        if(supportedIconExtensions.includes(fileType)){
                            file.icon = 'doctype:' + fileType;
                        }else{
                            file.icon = 'doctype:unknown';
                        }
                    }

                });
                this.dataList = finalData;
                console.log('dataList');
                console.log(this.dataList);
            })
            .catch(error => {
                console.error('Could not read data. \n',error);
            })
            .finally(()=> {
                this.isLoading = false;
            });
    }

    formatSize(bytes, decimals){
        if(bytes == 0) return '0 Bytes';
        let k = 1024;
        let unit = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        let i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + unit[i];
    };

    handleSearch(event){
        let value = event.target.value;
        let name = event.target.name;
        if (name === 'Title'){
            this.dataList = this.dataList.filter(file => {
                return file.Title.toLowerCase().includes(value.toLowerCase());
            });
        } else if(name === 'Created By'){
            this.dataList = this.dataList.filter(file => {
                return file.CREATED_BY.toLowerCase().includes(value.toLowerCase());
            });
        }
    }

    handleUplaodFinished(){
        this.handleSync();
    }
}