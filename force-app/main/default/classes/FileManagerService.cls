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

    /**
     * @param recordId
     * @param filterByCustomPermission If "True" User with the custom permissen "FileManagerViewAll" will
     * receive all Content Versions. Without the permission the User receive only  Files he owns.
     *
     * @return JSON String which contains a List of Content Versions which are linked to the input Record.
     */
    @AuraEnabled(Cacheable=false)
    public static String getContentVersions(String recordId, Boolean filterByCustomPermission) {
        List<ContentDocumentLink> contentDocumentLinks = [
                SELECT ContentDocumentId, ContentDocument.OwnerId, LinkedEntityId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :recordId
        ];

        Boolean userHasPermission = FeatureManagement.checkPermission(
                'FileManagerViewAll'
        );

        Id userId = UserInfo.getUserId();


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

        List<ContentVersion> contentVersions = [SELECT Id, FileType, Title,FileExtension, ContentDocumentId,
                ContentDocument.CreatedBy.Name, ContentDocument.ContentSize, CreatedDate, ContentDocument.FileType
                FROM ContentVersion WHERE ContentDocumentId IN :allDocumentIds];

        return JSON.serialize(contentVersions);
    }
}