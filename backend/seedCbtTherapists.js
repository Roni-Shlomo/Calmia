const pool = require('./config/db');

const sourceUrl = 'https://psychologim.com/psychologist/tipul-cbt/';

const therapists = [
  ['Mika Cohen', 'cbt', 'Clinical Psychologist', 'Herzliya', '0544571888', 'Hebrew, English'],
  ['Eilat Stark', 'cbt', 'Psychotherapist', 'Rehovot', '0542000939', 'Hebrew'],
  ['Veronica Ovadia', 'cbt', 'Psychotherapist', 'Raanana', '0528459986', 'Hebrew, English'],
  ['Veronica Ovadia', 'cbt', 'Psychotherapist', 'Shoham', '0528459986', 'Hebrew, English'],
  ['Gal Regev Schwartz', 'cbt', 'Clinical Psychologist', 'Kfar Saba', '0523846888', 'Hebrew'],
  ['Tal Vinitzky', 'cbt', 'Clinical Psychologist', 'Kfar Saba', '0506494724', 'Hebrew'],
  ['Or Hazan', 'cbt', 'Clinical Psychologist', 'Tel Aviv', '0542010002', 'Hebrew'],
  ['Maayan Hanik Biton', 'cbt', 'Psychotherapist', 'Hod Hasharon', '0545880203', 'Hebrew'],
  ['Noam Tevchnikov', 'cbt', 'Clinical Psychologist', 'Tel Aviv', '0503137889', 'Hebrew'],
  ['Noga Dim', 'cbt', 'Clinical Psychologist', 'Tel Aviv', '0528806628', 'Hebrew, English'],
  ['Lior Zohar', 'cbt', 'Psychologist', 'Tel Aviv', '0587999721', 'Hebrew'],
  ['Michal Elran', 'cbt', 'Psychotherapist', 'Kfar Saba', '0544292903', 'Hebrew'],
  ['Sharon Yardeni', 'cbt', 'Psychotherapist', 'Kfar Saba', '0523924775', 'Hebrew'],
  ['Alon Nirgad Guy', 'cbt', 'Clinical Psychologist', 'Tel Aviv', '0508531223', 'Hebrew'],
  ['Hadar Shir Feldheim', 'cbt', 'Psychotherapist', 'Jerusalem', '0542261446', 'Hebrew'],
  ['Keren Tal', 'cbt', 'Psychotherapist', 'Jerusalem', '0542171181', 'Hebrew'],
  ['Bracha Elgrabli', 'cbt', 'Psychotherapist', 'Beit Shemesh', '0559172235', 'Hebrew, French'],
  ['Dalia Ben Ami', 'cbt', 'Psychotherapist', 'Modiin', '0544794494', 'Hebrew'],
  ['Yitzhak Sharabi', 'cbt', 'Psychotherapist', 'Kiryat Ata', '0547679387', 'Hebrew'],
  ['Yitzhak Sharabi', 'cbt', 'Psychotherapist', 'Haifa', '0547679387', 'Hebrew'],
  ['Tamar Amrani', 'cbt', 'CBT Therapist', 'Petah Tikva', '0545468453', 'Hebrew'],
  ['Tamar Amrani', 'cbt', 'CBT Therapist', 'Elkana', '0545468453', 'Hebrew'],
  ['Osnat Zilberman', 'cbt', 'Psychotherapist', 'Givatayim', '0506792490', 'Hebrew, English'],
  ['Osnat Zilberman', 'cbt', 'Psychotherapist', 'Ramat Gan', '0506792490', 'Hebrew, English'],
  ['Dr. Mike Teplitz', 'cbt', 'Psychotherapist, Psychologist', 'Rosh Pina', '0505980983', 'Hebrew, English'],
  ['Dr. Mike Teplitz', 'cbt', 'Psychotherapist, Psychologist', 'Tzfat', '0505980983', 'Hebrew, English'],
  ['Yair Brown', 'cbt', 'Clinical Psychologist', 'Zichron Yaakov', '0507371769', 'Hebrew, English'],
  ['Yair Brown', 'cbt', 'Clinical Psychologist', 'Haifa', '0507371769', 'Hebrew, English'],
  ['Dr. Raya Blanky Voronov', 'cbt', 'Psychotherapist, CBT Therapist', 'Netanya', '0544934956', 'Hebrew, English, Russian'],
  ['Efrat Nagar Shmueli', 'cbt', 'Psychotherapist, CBT Therapist, Couples & Family Therapist', 'Ashdod', '0502028667', 'Hebrew'],
  ['Efrat Nagar Shmueli', 'cbt', 'Psychotherapist, CBT Therapist, Couples & Family Therapist', 'Nes Ziona', '0502028667', 'Hebrew'],
  ['Oshra Tavor Ben Yaakov', 'cbt', 'Psychotherapist, Couples & Family Therapist', 'Kadima Zoran', '0504485298', 'Hebrew'],
  ['Dr. Talma Cohen', 'cbt', 'Psychotherapist, Couples & Family Therapist', 'Tel Aviv', '0523496955', 'Hebrew'],
  ['Dr. Talma Cohen', 'cbt', 'Psychotherapist, Couples & Family Therapist', 'Zichron Yaakov', '0523496955', 'Hebrew'],
  ['Shirly Klein', 'cbt', 'Psychotherapist, Couples & Family Therapist', 'Kfar Saba', '0544700979', 'Hebrew'],
  ['Eliad Yagdal', 'cbt', 'Psychotherapist', 'Kiryat Motzkin', '0545835358', 'Hebrew'],
  ['Eliad Yagdal', 'cbt', 'Psychotherapist', 'Kiryat Ata', '0545835358', 'Hebrew'],
  ['Irit Ran', 'cbt', 'Psychotherapist, Couples & Family Therapist', 'Karmiel', '0544927651', 'Hebrew'],
  ['Irit Ran', 'cbt', 'Psychotherapist, Couples & Family Therapist', 'Nahariya', '0544927651', 'Hebrew'],
  ['Irit Golan Weiss', 'cbt', 'Psychotherapist', 'Haifa', '0508330359', 'Hebrew'],
  ['Irit Golan Weiss', 'cbt', 'Psychotherapist', 'Pardes Hana-Karkur', '0508330359', 'Hebrew'],
  ['Irit Sobol', 'cbt', 'Psychotherapist', 'Haifa', '0524601712', 'Hebrew'],
  ['Avital Weber Katkovsky', 'cbt', 'Psychotherapist, CBT Therapist', 'Haifa', '0545740938', 'Hebrew'],
  ['Avital Weber Katkovsky', 'cbt', 'Psychotherapist, CBT Therapist', 'Habonim', '0545740938', 'Hebrew'],
  ['Shai Shpitzen', 'cbt', 'Psychotherapist, Couples & Family Therapist', 'Tel Aviv', '0547222965', 'Hebrew'],
];

const cityCoordinates = {
  Herzliya: [32.1663, 34.8433],
  Rehovot: [31.8948, 34.8093],
  Raanana: [32.1848, 34.8713],
  Shoham: [31.9988, 34.9456],
  "Kfar Saba": [32.1782, 34.9076],
  "Tel Aviv": [32.0853, 34.7818],
  "Hod Hasharon": [32.1593, 34.8932],
  Jerusalem: [31.7683, 35.2137],
  "Beit Shemesh": [31.7470, 34.9881],
  Modiin: [31.8980, 35.0104],
  "Kiryat Ata": [32.8115, 35.1132],
  Haifa: [32.7940, 34.9896],
  "Petah Tikva": [32.0840, 34.8878],
  Elkana: [32.1103, 35.0329],
  Givatayim: [32.0722, 34.8125],
  "Ramat Gan": [32.0684, 34.8248],
  "Rosh Pina": [32.9687, 35.5426],
  Tzfat: [32.9658, 35.4983],
  "Zichron Yaakov": [32.5715, 34.9515],
  Netanya: [32.3215, 34.8532],
  Ashdod: [31.8014, 34.6435],
  "Nes Ziona": [31.9293, 34.7987],
  "Kadima Zoran": [32.2827, 34.9106],
  "Kiryat Motzkin": [32.8371, 35.0765],
  Karmiel: [32.9199, 35.2901],
  Nahariya: [33.0059, 35.0941],
  "Pardes Hanna-Karkur": [32.4740, 34.9760],
  Habonim: [32.6392, 34.9326],
};

async function seedTherapists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        specialty VARCHAR(255),
        city VARCHAR(255),
        phone VARCHAR(50),
        languages TEXT,
        source VARCHAR(255),
        source_url TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION
      );
    `);

    await pool.query(`DELETE FROM therapists WHERE type = 'cbt';`);

    for (const therapist of therapists) {

      const [name, type, specialty, city, phone, languages] = therapist;

      const coords = cityCoordinates[city] || [null, null];

      await pool.query(
        `
        INSERT INTO therapists
        (
          name,
          type,
          specialty,
          city,
          phone,
          languages,
          source,
          source_url,
          latitude,
          longitude
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `,
        [
          name,
          type,
          specialty,
          city,
          phone,
          languages,
          "Psychologim",
          sourceUrl,
          coords[0],
          coords[1],
        ]
      );
    }

    console.log("CBT therapists imported successfully");
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedTherapists();