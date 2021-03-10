/**
 *@author       Matthias Kottmann <matthias.kottmann@eigenherd.com>
 *@created      10.03.2021
 *
 *@description  FileManagerService -
 *
 *
 *
 */

public with sharing class FileManagerService {

    @AuraEnabled(Cacheable=true)
    public static String getContentVersions(String recordId, Boolean filterByCustomPermission) {
        System.debug('_____________________________________');
        System.debug('_____________________recordId________________' + recordId);
        System.debug('________________filterByCustomPermission_____________________' + filterByCustomPermission);
        List<ContentDocumentLink> contentDocumentLinks = [
                SELECT ContentDocumentId, ContentDocument.OwnerId, LinkedEntityId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :recordId
        ];
        System.debug('__________________checkPermission___________________');

        Boolean userHasPermission = FeatureManagement.checkPermission(
                'FileManagerViewAll'
        );
        System.debug('______________getUserId_______________________');

        Id userId = UserInfo.getUserId();

        System.debug('______________loop_______________________');

        Set<Id> allDocumentIds = new Set<Id>();
        for (ContentDocumentLink documentLink : contentDocumentLinks) {
            if (filterByCustomPermission && !userHasPermission) {
                if (documentLink.ContentDocument.OwnerId == userId) {
                    allDocumentIds.add(documentLink.ContentDocumentId);
                } else {
                    continue;
                }
            } else {
                allDocumentIds.add(documentLink.ContentDocumentId);
            }
        }

        List<ContentVersion> contentVersions = [SELECT Id, VersionData, FileType, Title,FileExtension, ContentDocumentId,
                ContentDocument.CreatedBy.Name, ContentDocument.ContentSize, CreatedDate, ContentDocument.FileType
                FROM ContentVersion WHERE ContentDocumentId IN :allDocumentIds];

        return JSON.serialize(contentVersions);
    }
}