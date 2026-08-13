// db/seed.js
// Populates the database with sample bases, users, equipment types, and a
// representative set of transactions so the dashboard has real numbers to
// show immediately after setup. Run with: npm run seed

import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    await client.query('BEGIN');

    // Wipe existing data (order matters for FK constraints)
    await client.query('TRUNCATE audit_logs, expenditures, assignments, transfers, purchases, equipment_types, users, bases RESTART IDENTITY CASCADE');

    // --- Bases ---
    const baseInsert = async (name, location) => {
      const { rows } = await client.query('INSERT INTO bases (name, location) VALUES ($1, $2) RETURNING id', [name, location]);
      return rows[0].id;
    };
    const fortAlphaId = await baseInsert('Fort Alpha', 'Rajasthan Sector, India');
    const fortBravoId = await baseInsert('Fort Bravo', 'Ladakh Sector, India');
    const fortCharlieId = await baseInsert('Fort Charlie', 'Assam Sector, India');

    // --- Users ---
    const hash = (pw) => bcrypt.hash(pw, 10);
    const userInsert = async (username, password, fullName, role, baseId) => {
      const { rows } = await client.query(
        `INSERT INTO users (username, password_hash, full_name, role, base_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [username, await hash(password), fullName, role, baseId]
      );
      return rows[0].id;
    };

    await userInsert('admin_user', 'AdminPass123!', 'System Administrator', 'ADMIN', null);
    await userInsert('commander_alpha', 'CommandPass123!', 'Col. Arjun Rathore', 'BASE_COMMANDER', fortAlphaId);
    await userInsert('commander_bravo', 'CommandPass123!', 'Col. Priya Menon', 'BASE_COMMANDER', fortBravoId);
    const logisticsOfficerId = await userInsert('logistics_officer', 'LogisticsPass123!', 'Maj. Karan Sisodia', 'LOGISTICS_OFFICER', fortAlphaId);

    // --- Equipment types ---
    const equipInsert = async (name, category, unit) => {
      const { rows } = await client.query(
        'INSERT INTO equipment_types (name, category, unit) VALUES ($1, $2, $3) RETURNING id',
        [name, category, unit]
      );
      return rows[0].id;
    };
    const humveeId = await equipInsert('Humvee', 'VEHICLE', 'vehicles');
    const m4Id = await equipInsert('M4 Carbine', 'WEAPON', 'rifles');
    const ammoId = await equipInsert('5.56mm Ammunition', 'AMMUNITION', 'rounds');
    await equipInsert('Field Medical Kit', 'VEHICLE', 'kits');

    // --- Sample transactional history ---
    await client.query(
      `INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, supplier, recorded_by_id) VALUES
       ($1,$2,12,8500000,'AM General LLC',$3),
       ($1,$4,150,45000,'Colt Defense',$3),
       ($1,$5,50000,25,'Ordnance Factory Board',$3),
       ($6,$2,6,8500000,'AM General LLC',$3)`,
      [fortAlphaId, humveeId, logisticsOfficerId, m4Id, ammoId, fortBravoId]
    );

    await client.query(
      `INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, status, initiated_by_id) VALUES
       ($1,$2,$3,8000,'COMPLETED',$4),
       ($1,$5,$6,20,'COMPLETED',$4)`,
      [fortAlphaId, fortBravoId, ammoId, logisticsOfficerId, fortCharlieId, m4Id]
    );

    await client.query(
      `INSERT INTO assignments (base_id, equipment_type_id, quantity, personnel_name, personnel_service_id, assigned_by_id) VALUES
       ($1,$2,40,'2nd Infantry Platoon','PLT-2IN-01',$3),
       ($1,$4,3,'Reconnaissance Unit','RCN-01',$3)`,
      [fortAlphaId, m4Id, logisticsOfficerId, humveeId]
    );

    await client.query(
      `INSERT INTO expenditures (base_id, equipment_type_id, quantity, reason, reported_by_id) VALUES
       ($1,$2,3200,'Live-fire training exercise, Q1',$3)`,
      [fortAlphaId, ammoId, logisticsOfficerId]
    );

    await client.query('COMMIT');

    console.log('Seed complete.');
    console.log('---------------------------------------------');
    console.log('Sample login credentials:');
    console.log('  ADMIN               admin_user / AdminPass123!');
    console.log('  BASE_COMMANDER      commander_alpha / CommandPass123!   (Fort Alpha)');
    console.log('  BASE_COMMANDER      commander_bravo / CommandPass123!   (Fort Bravo)');
    console.log('  LOGISTICS_OFFICER   logistics_officer / LogisticsPass123!  (Fort Alpha)');
    console.log('---------------------------------------------');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
