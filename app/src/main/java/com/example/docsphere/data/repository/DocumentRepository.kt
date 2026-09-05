package com.example.docsphere.data.repository

import com.example.docsphere.data.db.DocumentDao
import com.example.docsphere.data.model.DocumentEntity
import kotlinx.coroutines.flow.Flow

class DocumentRepository(private val documentDao: DocumentDao) {

    val allDocuments: Flow<List<DocumentEntity>> = documentDao.getAllDocuments()

    suspend fun getDocumentById(id: Long): DocumentEntity? {
        return documentDao.getDocumentById(id)
    }

    fun getDocumentsByFolder(folderId: String): Flow<List<DocumentEntity>> {
        return if (folderId == "all") {
            documentDao.getAllDocuments()
        } else {
            documentDao.getDocumentsByFolder(folderId)
        }
    }

    fun searchDocuments(query: String): Flow<List<DocumentEntity>> {
        return documentDao.searchDocuments(query)
    }

    suspend fun insertDocument(document: DocumentEntity): Long {
        return documentDao.insertDocument(document)
    }

    suspend fun insertAll(documents: List<DocumentEntity>) {
        documentDao.insertAll(documents)
    }

    suspend fun updateDocument(document: DocumentEntity) {
        documentDao.updateDocument(document)
    }

    suspend fun deleteDocument(document: DocumentEntity) {
        documentDao.deleteDocument(document)
    }

    suspend fun deleteById(id: Long) {
        documentDao.deleteById(id)
    }

    suspend fun clearAll() {
        documentDao.clearAll()
    }
}
