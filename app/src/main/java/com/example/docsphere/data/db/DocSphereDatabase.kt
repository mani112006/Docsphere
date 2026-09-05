package com.example.docsphere.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.docsphere.data.model.DocumentEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(entities = [DocumentEntity::class], version = 1, exportSchema = false)
abstract class DocSphereDatabase : RoomDatabase() {
    abstract fun documentDao(): DocumentDao

    companion object {
        @Volatile
        private var INSTANCE: DocSphereDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): DocSphereDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    DocSphereDatabase::class.java,
                    "docsphere.db"
                )
                    .addCallback(DocSphereDatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DocSphereDatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialData(database.documentDao())
                    }
                }
            }

            suspend fun populateInitialData(dao: DocumentDao) {
                dao.insertDocument(
                    DocumentEntity(
                        name = "Ration Card",
                        category = "ration",
                        holderName = "S. MANIKANDAN",
                        documentNumber = "TN-PDS-84729104",
                        issueDate = "2019-01-15",
                        expiryDate = null,
                        familyFolder = "my_vault",
                        description = "Family Ration Card Details & PDS entitlement"
                    )
                )
                dao.insertDocument(
                    DocumentEntity(
                        name = "Driving License",
                        category = "driving_licence",
                        holderName = "S. MANIKANDAN",
                        documentNumber = "TN61 20250001671",
                        issueDate = "2025-04-21",
                        expiryDate = "2046-12-10",
                        familyFolder = "my_vault",
                        description = "Transport Department DL with LMV & MCWG endorsement"
                    )
                )
            }
        }
    }
}
