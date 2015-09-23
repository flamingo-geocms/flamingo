/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package nl.b3p.viewer.util;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.net.URISyntaxException;
import java.sql.Connection;
import java.sql.SQLException;
import javax.persistence.EntityManager;
import javax.persistence.Persistence;
import junit.extensions.TestDecorator;
import nl.b3p.viewer.config.app.StartLayer;
import nl.b3p.viewer.config.metadata.Metadata;
import nl.b3p.viewer.util.databaseupdate.ScriptRunner;
import org.hibernate.Session;
import org.junit.After;
import org.junit.Assert;
import static org.junit.Assert.assertEquals;
import org.junit.Before;
import org.junit.BeforeClass;

/**
 * utility methoden voor unit tests.
 *
 * @author Mark Prins <mark@b3partners.nl>
 * @author Meine Toonen <meinetoonen@b3partners.nl>
 */
public abstract class TestUtil {

    protected static EntityManager entityManager;
    
    public Long applicationId = 1L;
    public String originalVersion = null;

    /**
     * initialisatie van EntityManager {@link #entityManager} en starten
     * transactie.
     *
     * @throws Exception if any
     *
     * @see #entityManager
     */
    @Before
    public void setUp() throws Exception {
        final String persistenceUnit = System.getProperty("test.persistence.unit");
        entityManager = Persistence.createEntityManagerFactory(persistenceUnit).createEntityManager();
        entityManager.getTransaction().begin();
        loadTestData();
        revertDBVersion();
        entityManager.getTransaction().begin();
    }

    
    private void revertDBVersion(){
        if(!entityManager.getTransaction().isActive()){
            entityManager.getTransaction().begin();
        }
        Metadata metadata = entityManager.createQuery("From Metadata where configKey = :v", Metadata.class).setParameter("v", Metadata.DATABASE_VERSION_KEY).getSingleResult();
        metadata.setConfigValue(originalVersion);
        entityManager.persist(metadata);
        entityManager.getTransaction().commit();
    }
    

    private boolean testdataLoaded = false;
    
    public void loadTestData() throws URISyntaxException, IOException, SQLException {
        if(testdataLoaded){
            return;
        }

        File f = new File(TestUtil.class.getResource("testdata.sql").toURI());
        executeScript(f);
        Metadata version = entityManager.createQuery("From Metadata where configKey = :v", Metadata.class).setParameter("v", Metadata.DATABASE_VERSION_KEY).getSingleResult();
        originalVersion = version.getConfigValue();

        testdataLoaded = true;

    }

    public void executeScript(File f) throws IOException, SQLException {
        Connection conn = null;

        try {
            Session session = (Session) entityManager.getDelegate();
            conn = (Connection) session.connection();
            ScriptRunner sr = new ScriptRunner(conn, true, true);
            sr.runScript(new FileReader(f));
            conn.commit();
            entityManager.flush();
        } finally {
            if (conn != null) {
                conn.close();
            }
        }
    }

    /**
     * sluiten van van EntityManager {@link #entityManager}.
     *
     * @throws Exception if any
     * @see #entityManager
     */
    @After
    public void close() throws Exception {
        if (entityManager.isOpen()) {
            entityManager.close();
        }
    }
    
    public <T> void persistEntityTest(T entity, Class<T> clazz){
        entityManager.persist(entity);
        entityManager.getTransaction().commit();

        T test = entityManager.find(clazz, 1L);
        Assert.assertNotNull(test);
    }
    
    public <T> void persistAndDeleteEntityTest(T entity, Class<T> clazz){
        persistEntityTest(entity, clazz);
        entityManager.getTransaction().begin();

        entityManager.remove(entity);
        entityManager.getTransaction().commit();
        entityManager.getTransaction().begin();
    }
}
