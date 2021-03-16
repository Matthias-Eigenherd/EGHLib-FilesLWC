/**
 * Created by mkottmann on 16.03.21.
 */

@IsTest
private class FileManagerServiceTest {
    @IsTest
    static void getContentVersionsTest() {
        Account account = new Account(Name='test');
        insert account;

        ContentVersion contentVersion = new ContentVersion();
        contentVersion.ContentLocation = 'S';
        contentVersion.PathOnClient = 'Title';
        contentVersion.Title = 'Title';
        contentVersion.VersionData = Blob.valueOf('test');

        insert contentVersion;

        contentVersion = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id];

        ContentDocumentLink contentDocumentLink = new ContentDocumentLink();
        contentDocumentLink.ContentDocumentId = contentVersion.ContentDocumentId;
        contentDocumentLink.LinkedEntityId = account.Id;
        contentDocumentLink.ShareType = 'V';
        contentDocumentLink.Visibility = 'AllUsers';

        insert contentDocumentLink;

        String contentVersionsString = FileManagerService.getContentVersions(account.Id, false);

        List<ContentVersion> contentVersions = (List<ContentVersion>)JSON.deserialize(contentVersionsString, List<ContentVersion>.class);

        System.assertEquals(1, contentVersions.size());
    }
}