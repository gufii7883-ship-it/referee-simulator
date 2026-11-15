import { DivisionId, RegionId } from '../types/game';

export type ClubTier = 'div4' | 'div3' | 'div2' | 'div1' | 'premier' | 'international';

export interface ClubDef {
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  gkColor: string;
  stadiumName: string;
  squadNames?: string[];
}

export interface LeagueDef {
  id: string;
  region: RegionId;
  country: string;
  name: string;
  tiers: ClubTier[];
  clubs: ClubDef[];
  firstNames: string[];
  lastNames: string[];
}

export const REGION_LEAGUES: LeagueDef[] = [
  // =========================================================================
  // DIVISION 4 (Level 1) — Authentic 4th-tier & Regional Grassroots Leagues
  // =========================================================================
  {
    id: 'eng_league_two',
    region: 'europe',
    country: 'England',
    name: 'EFL League Two',
    tiers: ['div4'],
    clubs: [
      { name: 'Bradford City', shortName: 'BRA', primaryColor: '#7c1d30', secondaryColor: '#f59e0b', gkColor: '#0ea5e9', stadiumName: 'Valley Parade' },
      { name: 'Notts County', shortName: 'NOT', primaryColor: '#111827', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'Meadow Lane' },
      { name: 'AFC Wimbledon', shortName: 'WIM', primaryColor: '#1d4ed8', secondaryColor: '#facc15', gkColor: '#dc2626', stadiumName: 'Plough Lane' },
      { name: 'Carlisle United', shortName: 'CAR', primaryColor: '#2563eb', secondaryColor: '#ffffff', gkColor: '#f97316', stadiumName: 'Brunton Park' },
    ],
    firstNames: ['Callum', 'George', 'Sam', 'Lewis', 'Elliot', 'Jake', 'Matty', 'Josh', 'Ben', 'Charlie', 'Ryan', 'Owen', 'Luke', 'Tom', 'Dan', 'Alfie'],
    lastNames: ['Cook', 'Palmer', 'Walker', 'Bennett', 'Wright', 'Edwards', 'Harrison', 'Clarke', 'Taylor', 'Robinson', 'Hughes', 'Morgan', 'Cooper', 'Ward', 'Barker', 'Dawson'],
  },
  {
    id: 'ger_regionalliga',
    region: 'europe',
    country: 'Germany',
    name: 'Regionalliga',
    tiers: ['div4'],
    clubs: [
      { name: 'Kickers Offenbach', shortName: 'OFC', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#0284c7', stadiumName: 'Bieberer Berg' },
      { name: 'SV Meppen', shortName: 'SVM', primaryColor: '#1d4ed8', secondaryColor: '#f8fafc', gkColor: '#eab308', stadiumName: 'Hänsch-Arena' },
      { name: 'Chemnitzer FC', shortName: 'CFC', primaryColor: '#0ea5e9', secondaryColor: '#ffffff', gkColor: '#16a34a', stadiumName: 'Stadion an der Gellertstraße' },
      { name: 'FSV Zwickau', shortName: 'ZWI', primaryColor: '#b91c1c', secondaryColor: '#f8fafc', gkColor: '#0f172a', stadiumName: 'GGZ-Arena' },
    ],
    firstNames: ['Lukas', 'Jonas', 'Tobias', 'Marcel', 'Jan', 'Tim', 'Patrick', 'Kevin', 'Moritz', 'Philipp', 'Fabian', 'Stefan', 'Simon', 'Sebastian', 'Bastian', 'Felix'],
    lastNames: ['Weber', 'Hoffmann', 'Schäfer', 'Becker', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Krause'],
  },
  {
    id: 'esp_segunda_fed',
    region: 'europe',
    country: 'Spain',
    name: 'Segunda Federación',
    tiers: ['div4'],
    clubs: [
      { name: 'CD Numancia', shortName: 'NUM', primaryColor: '#dc2626', secondaryColor: '#1e3a8a', gkColor: '#16a34a', stadiumName: 'Los Pajaritos' },
      { name: 'Pontevedra CF', shortName: 'PON', primaryColor: '#7f1d1d', secondaryColor: '#f8fafc', gkColor: '#0ea5e9', stadiumName: 'Pasarón' },
      { name: 'UD Logroñés', shortName: 'LOG', primaryColor: '#b91c1c', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Las Gaunas' },
      { name: 'CE Sabadell', shortName: 'SAB', primaryColor: '#0284c7', secondaryColor: '#f8fafc', gkColor: '#f97316', stadiumName: 'Nova Creu Alta' },
    ],
    firstNames: ['Carlos', 'Javier', 'Sergio', 'Adrián', 'Rubén', 'Marcos', 'Jorge', 'Raúl', 'Víctor', 'Alberto', 'David', 'Iván', 'Óscar', 'Mario', 'Hugo', 'Diego'],
    lastNames: ['Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Jiménez', 'Moreno', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Serrano', 'Molina', 'Blanco', 'Delgado'],
  },
  {
    id: 'egypt_div3',
    region: 'africa',
    country: 'Egypt',
    name: 'Egyptian Third Division',
    tiers: ['div4'],
    clubs: [
      { name: 'El Mansoura SC', shortName: 'MAN', primaryColor: '#ea580c', secondaryColor: '#ffffff', gkColor: '#16a34a', stadiumName: 'El Mansoura Stadium' },
      { name: 'Gomhoriat Shebin', shortName: 'SHB', primaryColor: '#1d4ed8', secondaryColor: '#f8fafc', gkColor: '#eab308', stadiumName: 'Shebin Stadium' },
      { name: 'Damanhour SC', shortName: 'DAM', primaryColor: '#0284c7', secondaryColor: '#ffffff', gkColor: '#dc2626', stadiumName: 'Damanhour Stadium' },
      { name: 'Beni Suef SC', shortName: 'BSF', primaryColor: '#15803d', secondaryColor: '#fef08a', gkColor: '#0f172a', stadiumName: 'Beni Suef Field' },
    ],
    firstNames: ['Mahmoud', 'Ahmed', 'Mohamed', 'Mostafa', 'Karim', 'Tarek', 'Hossam', 'Amr', 'Islam', 'Khaled', 'Sherif', 'Hesham', 'Ibrahim', 'Ramy', 'Walid', 'Ayman'],
    lastNames: ['Hassan', 'Ibrahim', 'Mahmoud', 'Abdelrahman', 'Elsayed', 'Fathy', 'Gamal', 'Nabil', 'Saad', 'Adel', 'Tawfik', 'Mansour', 'Samir', 'Farouk', 'Ragab', 'Galal'],
  },
  {
    id: 'morocco_amateur',
    region: 'africa',
    country: 'Morocco',
    name: 'National Amateur League',
    tiers: ['div4'],
    clubs: [
      { name: 'KAC Kénitra', shortName: 'KAC', primaryColor: '#15803d', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Stade Municipal Kénitra' },
      { name: 'Ittihad Khémisset', shortName: 'IZK', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#0284c7', stadiumName: 'Stade 18 Novembre' },
      { name: 'Chabab Atlas Khénifra', shortName: 'CAK', primaryColor: '#b91c1c', secondaryColor: '#facc15', gkColor: '#16a34a', stadiumName: 'Stade Khénifra' },
      { name: 'Racing Casablanca', shortName: 'RAC', primaryColor: '#0369a1', secondaryColor: '#f8fafc', gkColor: '#f97316', stadiumName: 'Stade Père-Jégo' },
    ],
    firstNames: ['Youssef', 'Hamza', 'Ayoub', 'Zakaria', 'Amine', 'Soufiane', 'Oussama', 'Mehdi', 'Anas', 'Marouane', 'Badr', 'Hicham', 'Adil', 'Tarik', 'Rachid', 'Khalid'],
    lastNames: ['El-Idrissi', 'Bennani', 'Benali', 'Chakir', 'El-Amrani', 'Tazi', 'Ziani', 'Berrada', 'El-Malki', 'Haddad', 'Mansouri', 'Rahimi', 'Khalfi', 'Sbai', 'Fathi', 'Alami'],
  },
  {
    id: 'saudi_div3',
    region: 'asia',
    country: 'Saudi Arabia',
    name: 'Saudi Third Division',
    tiers: ['div4'],
    clubs: [
      { name: 'Al-Washm', shortName: 'WSH', primaryColor: '#0284c7', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Shaqra Stadium' },
      { name: 'Al-Sharq', shortName: 'SHQ', primaryColor: '#15803d', secondaryColor: '#f8fafc', gkColor: '#dc2626', stadiumName: 'Al-Kharj Club Field' },
      { name: 'Al-Entesar', shortName: 'ENT', primaryColor: '#1d4ed8', secondaryColor: '#facc15', gkColor: '#16a34a', stadiumName: 'Rabigh Stadium' },
      { name: 'Al-Qala', shortName: 'QAL', primaryColor: '#b91c1c', secondaryColor: '#f8fafc', gkColor: '#0ea5e9', stadiumName: 'Al-Jouf Sports City' },
    ],
    firstNames: ['Fahad', 'Turki', 'Nawaf', 'Faisal', 'Sultan', 'Bander', 'Abdulrahman', 'Majeed', 'Rakan', 'Meshal', 'Saad', 'Khaled', 'Abdullah', 'Saeed', 'Nasser', 'Hamad'],
    lastNames: ['Al-Otaibi', 'Al-Harbi', 'Al-Qahtani', 'Al-Zahrani', 'Al-Ghamdi', 'Al-Mutairi', 'Al-Anazi', 'Al-Shehri', 'Al-Dosari', 'Al-Subaie', 'Al-Shamrani', 'Al-Bishi', 'Al-Juhani', 'Al-Malki', 'Al-Khaldi', 'Al-Asmari'],
  },
  {
    id: 'arab_div4',
    region: 'arab',
    country: 'Arab World',
    name: 'Arab Regional League Div.4',
    tiers: ['div4'],
    clubs: [
      { name: 'Al-Tadhamon', shortName: 'TAD', primaryColor: '#1d4ed8', secondaryColor: '#ffffff', gkColor: '#f59e0b', stadiumName: 'Farwaniya Ground' },
      { name: 'Al-Mesaimeer', shortName: 'MES', primaryColor: '#dc2626', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'Al-Sailiya Pitch' },
      { name: 'Al-Yarmouk Amman', shortName: 'YAR', primaryColor: '#0f172a', secondaryColor: '#ef4444', gkColor: '#0ea5e9', stadiumName: 'King Abdullah II Park' },
      { name: 'Dibba Al-Hisn', shortName: 'DIB', primaryColor: '#15803d', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Dibba Stadium' },
    ],
    firstNames: ['Omar', 'Ali', 'Yazan', 'Zaid', 'Tamer', 'Rami', 'Fadi', 'Bilal', 'Nour', 'Sami', 'Hassan', 'Mazen', 'Wael', 'Laith', 'Hani', 'Adel'],
    lastNames: ['Al-Khatib', 'Al-Masri', 'Haddad', 'Al-Ali', 'Sulaiman', 'Jaber', 'Mansour', 'Al-Naimi', 'Darwish', 'Qasim', 'Salameh', 'Barakat', 'Nassar', 'Al-Saeed', 'Hamdan', 'Ayman'],
  },
  {
    id: 'arg_primera_c',
    region: 'americas',
    country: 'Argentina',
    name: 'Primera C Metropolitana',
    tiers: ['div4'],
    clubs: [
      { name: 'Deportivo Español', shortName: 'DEP', primaryColor: '#dc2626', secondaryColor: '#facc15', gkColor: '#16a34a', stadiumName: 'Nueva España' },
      { name: 'Ituzaingó', shortName: 'ITU', primaryColor: '#15803d', secondaryColor: '#ffffff', gkColor: '#0284c7', stadiumName: 'Carlos Sacaan' },
      { name: 'Central Córdoba (R)', shortName: 'CCR', primaryColor: '#1e3a8a', secondaryColor: '#dc2626', gkColor: '#f59e0b', stadiumName: 'Gabino Sosa' },
      { name: 'Berazategui', shortName: 'BER', primaryColor: '#ea580c', secondaryColor: '#f8fafc', gkColor: '#0f172a', stadiumName: 'Norman Lee' },
    ],
    firstNames: ['Matías', 'Lucas', 'Nicolás', 'Facundo', 'Agustín', 'Ezequiel', 'Tomás', 'Federico', 'Ignacio', 'Franco', 'Santiago', 'Gonzalo', 'Juan', 'Gastón', 'Brian', 'Leandro'],
    lastNames: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Pérez', 'Sánchez', 'Romero', 'Sosa', 'Torres', 'Álvarez', 'Ruiz', 'Ramírez', 'Acosta', 'Benítez'],
  },
  {
    id: 'aus_npl_lower',
    region: 'australia',
    country: 'Australia',
    name: 'NPL State Division',
    tiers: ['div4', 'div3'],
    clubs: [
      { name: 'South Melbourne FC', shortName: 'SMF', primaryColor: '#1d4ed8', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Lakeside Stadium' },
      { name: 'Sydney United 58', shortName: 'SU58', primaryColor: '#dc2626', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'Sydney United Sports Centre' },
      { name: 'APIA Leichhardt', shortName: 'API', primaryColor: '#7f1d1d', secondaryColor: '#1e3a8a', gkColor: '#0ea5e9', stadiumName: 'Lambert Park' },
      { name: 'Heidelberg United', shortName: 'HBG', primaryColor: '#facc15', secondaryColor: '#0f172a', gkColor: '#dc2626', stadiumName: 'Olympic Village' },
    ],
    firstNames: ['Liam', 'Lachlan', 'Mitchell', 'Nathan', 'Dylan', 'Corey', 'Jordan', 'Jesse', 'Trent', 'Harrison', 'Daniel', 'Nicholas', 'Anthony', 'James', 'Michael', 'Luke'],
    lastNames: ['Smith', 'Williams', 'Jones', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Martin', 'Thompson', 'White', 'Harris', 'Walker', 'Kelly', 'Murray', 'Papadopoulos'],
  },

  // =========================================================================
  // DIVISION 3 (Level 2) — Authentic 3rd-Tier Leagues
  // =========================================================================
  {
    id: 'eng_league_one',
    region: 'europe',
    country: 'England',
    name: 'EFL League One',
    tiers: ['div3'],
    clubs: [
      { name: 'Birmingham City', shortName: 'BIR', primaryColor: '#1d4ed8', secondaryColor: '#ffffff', gkColor: '#f59e0b', stadiumName: 'St Andrew’s' },
      { name: 'Bolton Wanderers', shortName: 'BOL', primaryColor: '#f8fafc', secondaryColor: '#1e3a8a', gkColor: '#16a34a', stadiumName: 'Toughsheet Community Stadium' },
      { name: 'Huddersfield Town', shortName: 'HUD', primaryColor: '#0284c7', secondaryColor: '#ffffff', gkColor: '#dc2626', stadiumName: 'John Smith’s Stadium' },
      { name: 'Charlton Athletic', shortName: 'CHA', primaryColor: '#dc2626', secondaryColor: '#f8fafc', gkColor: '#0f172a', stadiumName: 'The Valley' },
    ],
    firstNames: ['Alfie', 'Jay', 'Conor', 'Ethan', 'Brandon', 'Aaron', 'Joe', 'Jack', 'Harvey', 'Nathan', 'Callum', 'Sam', 'Jamie', 'Kieran', 'Marcus', 'Charlie'],
    lastNames: ['May', 'Charles', 'Thomason', 'Ahadme', 'Campbell', 'Hogg', 'Mitchell', 'Collins', 'Doyle', 'Evans', 'Roberts', 'Mason', 'Shaw', 'Brooks', 'Pearson', 'Fletcher'],
  },
  {
    id: 'ger_3liga',
    region: 'europe',
    country: 'Germany',
    name: '3. Liga',
    tiers: ['div3'],
    clubs: [
      { name: 'Dynamo Dresden', shortName: 'SGD', primaryColor: '#eab308', secondaryColor: '#0f172a', gkColor: '#0284c7', stadiumName: 'Rudolf-Harbig-Stadion' },
      { name: 'TSV 1860 Munich', shortName: 'M60', primaryColor: '#38bdf8', secondaryColor: '#f8fafc', gkColor: '#dc2626', stadiumName: 'Grünwalder Stadion' },
      { name: 'Arminia Bielefeld', shortName: 'DSC', primaryColor: '#1d4ed8', secondaryColor: '#0f172a', gkColor: '#16a34a', stadiumName: 'SchücoArena' },
      { name: 'Hansa Rostock', shortName: 'FCH', primaryColor: '#0369a1', secondaryColor: '#ffffff', gkColor: '#f59e0b', stadiumName: 'Ostseestadion' },
    ],
    firstNames: ['Christoph', 'Stefan', 'Niklas', 'Maximilian', 'Robin', 'Marius', 'Dominik', 'Sascha', 'Julian', 'Tim', 'Yannick', 'Luca', 'Sven', 'Christian', 'Hannes', 'Marco'],
    lastNames: ['Daferner', 'Kutschke', 'Hauptmann', 'Schröter', 'Verlaat', 'Wörl', 'Corboz', 'Kersken', 'Rossipal', 'Fröling', 'Schumacher', 'Bär', 'Lehmann', 'Köhler', 'Meier', 'Keller'],
  },
  {
    id: 'ita_serie_c',
    region: 'europe',
    country: 'Italy',
    name: 'Serie C',
    tiers: ['div3'],
    clubs: [
      { name: 'Catania FC', shortName: 'CAT', primaryColor: '#dc2626', secondaryColor: '#0284c7', gkColor: '#eab308', stadiumName: 'Angelo Massimino' },
      { name: 'Benevento Calcio', shortName: 'BEN', primaryColor: '#facc15', secondaryColor: '#b91c1c', gkColor: '#0f172a', stadiumName: 'Ciro Vigorito' },
      { name: 'LR Vicenza', shortName: 'VIC', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#16a34a', stadiumName: 'Romeo Menti' },
      { name: 'Pescara Calcio', shortName: 'PES', primaryColor: '#38bdf8', secondaryColor: '#f8fafc', gkColor: '#f97316', stadiumName: 'Adriatico-Giovanni Cornacchia' },
    ],
    firstNames: ['Matteo', 'Lorenzo', 'Simone', 'Emanuele', 'Filippo', 'Davide', 'Andrea', 'Francesco', 'Luca', 'Marco', 'Alberto', 'Gabriele', 'Alessio', 'Tommaso', 'Stefano', 'Nicola'],
    lastNames: ['Ferrari', 'Rinaldi', 'Lombardi', 'Esposito', 'Moretti', 'Conti', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Costa', 'Giordano', 'Mancini', 'Santoro', 'De Luca'],
  },
  {
    id: 'egypt_div2b',
    region: 'africa',
    country: 'Egypt',
    name: 'Egyptian Second Division B',
    tiers: ['div3'],
    clubs: [
      { name: 'Tersana SC', shortName: 'TER', primaryColor: '#1d4ed8', secondaryColor: '#f8fafc', gkColor: '#f59e0b', stadiumName: 'Hassan El-Shazly Stadium' },
      { name: 'Olympic Club', shortName: 'OLY', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#16a34a', stadiumName: 'Ezz El-Din Yacoub' },
      { name: 'Suez SC', shortName: 'SUE', primaryColor: '#0284c7', secondaryColor: '#facc15', gkColor: '#0f172a', stadiumName: 'Suez Stadium' },
      { name: 'Al-Sekka Al-Hadid', shortName: 'SEK', primaryColor: '#15803d', secondaryColor: '#ffffff', gkColor: '#dc2626', stadiumName: 'Al-Sekka Stadium' },
    ],
    firstNames: ['Mohamed', 'Ahmed', 'Mahmoud', 'Ibrahim', 'Eslam', 'Mustafa', 'Yasser', 'Alaa', 'Hazem', 'Tamer', 'Hany', 'Ashraf', 'Sameh', 'Sayed', 'Magdy', 'Essam'],
    lastNames: ['Abdelaziz', 'El-Gamal', 'El-Shazly', 'Kamel', 'Metwally', 'Hegazy', 'Reda', 'Shaaban', 'Soliman', 'Eid', 'Barakat', 'Mohsen', 'Sobhy', 'Hamdy', 'Gomaa', 'Shehata'],
  },
  {
    id: 'saudi_div2',
    region: 'asia',
    country: 'Saudi Arabia',
    name: 'Saudi Second Division',
    tiers: ['div3'],
    clubs: [
      { name: 'Al-Najma', shortName: 'NAJ', primaryColor: '#16a34a', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Al-Najma Stadium' },
      { name: 'Al-Diriyah', shortName: 'DIR', primaryColor: '#78350f', secondaryColor: '#f8fafc', gkColor: '#0284c7', stadiumName: 'Prince Turki Stadium' },
      { name: 'Al-Jeel', shortName: 'JEL', primaryColor: '#0284c7', secondaryColor: '#facc15', gkColor: '#dc2626', stadiumName: 'Prince Abdullah Bin Jalawi' },
      { name: 'Al-Kawkab', shortName: 'KWK', primaryColor: '#eab308', secondaryColor: '#0f172a', gkColor: '#16a34a', stadiumName: 'Al-Shoulla Stadium' },
    ],
    firstNames: ['Abdulaziz', 'Saleh', 'Mohammed', 'Majed', 'Nawaf', 'Fawaz', 'Tariq', 'Ziad', 'Rayan', 'Badr', 'Thamer', 'Faleh', 'Mishaal', 'Waleed', 'Hussain', 'Adnan'],
    lastNames: ['Al-Rashidi', 'Al-Dossary', 'Al-Shammari', 'Al-Qahtani', 'Al-Harthi', 'Al-Tamimi', 'Al-Sulaiman', 'Al-Amri', 'Al-Ghamdi', 'Al-Ruwaili', 'Al-Johani', 'Al-Enazi', 'Al-Zahrani', 'Al-Buraikan', 'Al-Yami', 'Al-Olayan'],
  },
  {
    id: 'bra_seriec',
    region: 'americas',
    country: 'Brazil',
    name: 'Brasileirão Série C',
    tiers: ['div3'],
    clubs: [
      { name: 'Clube do Remo', shortName: 'REM', primaryColor: '#1e3a8a', secondaryColor: '#f8fafc', gkColor: '#eab308', stadiumName: 'Baenão' },
      { name: 'Náutico', shortName: 'NAU', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#0284c7', stadiumName: 'Aflitos' },
      { name: 'Figueirense', shortName: 'FIG', primaryColor: '#0f172a', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'Orlando Scarpelli' },
      { name: 'Ypiranga FC', shortName: 'YPI', primaryColor: '#facc15', secondaryColor: '#15803d', gkColor: '#dc2626', stadiumName: 'Colosso da Lagoa' },
    ],
    firstNames: ['Rafael', 'Lucas', 'Matheus', 'Gabriel', 'Bruno', 'Rodrigo', 'Thiago', 'Leonardo', 'Guilherme', 'Gustavo', 'Eduardo', 'Henrique', 'Danilo', 'Vinícius', 'Marcelo', 'Felipe'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha'],
  },

  // =========================================================================
  // DIVISION 2 (Level 3) — Authentic 2nd-Tier Championships
  // =========================================================================
  {
    id: 'eng_championship',
    region: 'europe',
    country: 'England',
    name: 'EFL Championship',
    tiers: ['div2'],
    clubs: [
      { name: 'Leeds United', shortName: 'LEE', primaryColor: '#f8fafc', secondaryColor: '#1d4ed8', gkColor: '#16a34a', stadiumName: 'Elland Road' },
      { name: 'Sunderland AFC', shortName: 'SUN', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#0ea5e9', stadiumName: 'Stadium of Light' },
      { name: 'Sheffield United', shortName: 'SHU', primaryColor: '#b91c1c', secondaryColor: '#0f172a', gkColor: '#eab308', stadiumName: 'Bramall Lane' },
      { name: 'Middlesbrough', shortName: 'MID', primaryColor: '#dc2626', secondaryColor: '#f8fafc', gkColor: '#0284c7', stadiumName: 'Riverside Stadium' },
    ],
    firstNames: ['Patrick', 'Dan', 'Joe', 'Luke', 'Ben', 'Jack', 'Chris', 'Jobe', 'Hayden', 'Finn', 'Morgan', 'Callum', 'Ollie', 'Max', 'Sam', 'Tom'],
    lastNames: ['Bamford', 'James', 'Rodon', 'Ayling', 'Clarke', 'Bellingham', 'Hackney', 'Azaz', 'Hamer', 'O’Hare', 'Byram', 'Patterson', 'Cooper', 'Whittaker', 'Morris', 'Gibson'],
  },
  {
    id: 'ger_2bundesliga',
    region: 'europe',
    country: 'Germany',
    name: '2. Bundesliga',
    tiers: ['div2'],
    clubs: [
      { name: 'Hamburger SV', shortName: 'HSV', primaryColor: '#1d4ed8', secondaryColor: '#ffffff', gkColor: '#f59e0b', stadiumName: 'Volksparkstadion' },
      { name: 'FC Schalke 04', shortName: 'S04', primaryColor: '#1e40af', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'Veltins-Arena' },
      { name: '1. FC Köln', shortName: 'KOE', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#0f172a', stadiumName: 'RheinEnergieStadion' },
      { name: 'Hertha BSC', shortName: 'BSC', primaryColor: '#2563eb', secondaryColor: '#f8fafc', gkColor: '#eab308', stadiumName: 'Olympiastadion Berlin' },
    ],
    firstNames: ['Robert', 'Jonas', 'Linton', 'Florian', 'Timo', 'Kenan', 'Fabian', 'Jan', 'Paul', 'Derry', 'Miro', 'Dominique', 'Leart', 'Ron', 'Marc', 'Sven'],
    lastNames: ['Glatzel', 'Meffert', 'Maina', 'Kainz', 'Hübers', 'Karaman', 'Reese', 'Thielmann', 'Seguin', 'Scherhant', 'Muheim', 'Heintz', 'Paqarada', 'Schallenberg', 'Kempf', 'Michel'],
  },
  {
    id: 'esp_segunda',
    region: 'europe',
    country: 'Spain',
    name: 'LaLiga Hypermotion',
    tiers: ['div2'],
    clubs: [
      { name: 'Real Zaragoza', shortName: 'ZAR', primaryColor: '#f8fafc', secondaryColor: '#1d4ed8', gkColor: '#16a34a', stadiumName: 'La Romareda' },
      { name: 'Sporting Gijón', shortName: 'SPG', primaryColor: '#dc2626', secondaryColor: '#ffffff', gkColor: '#0f172a', stadiumName: 'El Molinón' },
      { name: 'Racing Santander', shortName: 'RAC', primaryColor: '#16a34a', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'El Sardinero' },
      { name: 'Levante UD', shortName: 'LEV', primaryColor: '#1e3a8a', secondaryColor: '#b91c1c', gkColor: '#0ea5e9', stadiumName: 'Ciutat de València' },
    ],
    firstNames: ['Iván', 'Mario', 'Pablo', 'Sergio', 'Iñigo', 'Carlos', 'Javi', 'Nacho', 'Andrés', 'Gaspar', 'Fran', 'Álex', 'Ager', 'Unai', 'Adrián', 'Rubén'],
    lastNames: ['Azón', 'Soberón', 'Campos', 'Vicente', 'Martín', 'Aketxe', 'Morales', 'Brugui', 'Cote', 'Yáñez', 'Lozano', 'Cabrera', 'Calero', 'Dela', 'Peña', 'Álvarez'],
  },
  {
    id: 'egypt_div2a',
    region: 'africa',
    country: 'Egypt',
    name: 'Egyptian Second Division A',
    tiers: ['div2'],
    clubs: [
      { name: 'Wadi Degla SC', shortName: 'WDG', primaryColor: '#facc15', secondaryColor: '#0f172a', gkColor: '#0284c7', stadiumName: 'Al-Salam Stadium' },
      { name: 'Petrojet FC', shortName: 'PET', primaryColor: '#dc2626', secondaryColor: '#1e3a8a', gkColor: '#16a34a', stadiumName: 'Petro Sport Stadium' },
      { name: 'Ghazl El Mahalla', shortName: 'GMH', primaryColor: '#0284c7', secondaryColor: '#f8fafc', gkColor: '#f59e0b', stadiumName: 'El Mahalla Stadium' },
      { name: 'Haras El Hodood', shortName: 'HRS', primaryColor: '#b91c1c', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'Harras El-Hedoud Stadium' },
    ],
    firstNames: ['Ahmed', 'Mohamed', 'Karim', 'Mahmoud', 'Abdelrahman', 'Khaled', 'Youssef', 'Mostafa', 'Omar', 'Amr', 'Fawzy', 'Tarek', 'Shehab', 'Islam', 'Nasser', 'Ziad'],
    lastNames: ['Atef', 'Gaber', 'El-Khouly', 'Mamdouh', 'Rashed', 'El-Saied', 'Badr', 'Talaat', 'Shokry', 'Hamza', 'Sabry', 'El-Gazzar', 'Fouad', 'Khattab', 'Morsi', 'Zaki'],
  },
  {
    id: 'saudi_yelo',
    region: 'asia',
    country: 'Saudi Arabia',
    name: 'Saudi First Division (Yelo)',
    tiers: ['div2'],
    clubs: [
      { name: 'Al-Hazem', shortName: 'HAZ', primaryColor: '#eab308', secondaryColor: '#1e3a8a', gkColor: '#16a34a', stadiumName: 'Al-Hazem Club Stadium' },
      { name: 'Al-Adalah', shortName: 'ADL', primaryColor: '#b91c1c', secondaryColor: '#f8fafc', gkColor: '#0284c7', stadiumName: 'Prince Abdullah Bin Jalawi' },
      { name: 'Al-Jabalain', shortName: 'JBL', primaryColor: '#7c2d12', secondaryColor: '#f8fafc', gkColor: '#eab308', stadiumName: 'Prince Abdulaziz Bin Musa’ed' },
      { name: 'Abha Club', shortName: 'ABH', primaryColor: '#1d4ed8', secondaryColor: '#dc2626', gkColor: '#16a34a', stadiumName: 'Prince Sultan Bin Abdulaziz' },
    ],
    firstNames: ['Fahad', 'Saad', 'Sultan', 'Abdullah', 'Abdulaziz', 'Saleh', 'Yasser', 'Nawaf', 'Firas', 'Riyadh', 'Meshal', 'Saud', 'Hassan', 'Khalid', 'Ibrahim', 'Hamad'],
    lastNames: ['Al-Johani', 'Al-Harbi', 'Al-Qahtani', 'Al-Shammeri', 'Al-Mutairi', 'Al-Ghamdi', 'Al-Shahrani', 'Al-Anazi', 'Al-Amri', 'Al-Dawsari', 'Al-Subaie', 'Al-Khaldi', 'Al-Bishi', 'Al-Otaibi', 'Al-Yami', 'Al-Malki'],
  },
  {
    id: 'bra_serieb',
    region: 'americas',
    country: 'Brazil',
    name: 'Brasileirão Série B',
    tiers: ['div2'],
    clubs: [
      { name: 'Santos FC', shortName: 'SAN', primaryColor: '#f8fafc', secondaryColor: '#0f172a', gkColor: '#0284c7', stadiumName: 'Vila Belmiro' },
      { name: 'Sport Recife', shortName: 'SPT', primaryColor: '#dc2626', secondaryColor: '#0f172a', gkColor: '#eab308', stadiumName: 'Ilha do Retiro' },
      { name: 'Coritiba', shortName: 'CFC', primaryColor: '#15803d', secondaryColor: '#ffffff', gkColor: '#0ea5e9', stadiumName: 'Couto Pereira' },
      { name: 'Ceará SC', shortName: 'CEA', primaryColor: '#0f172a', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'Arena Castelão' },
    ],
    firstNames: ['Guilherme', 'Diego', 'João', 'Lucas', 'Matheus', 'Pedro', 'Gabriel', 'Erick', 'Caio', 'Bruno', 'Igor', 'Vitor', 'Renato', 'Luan', 'Rômulo', 'Arthur'],
    lastNames: ['Pituca', 'Schmidt', 'Ferreira', 'Barletta', 'Lima', 'Coutinho', 'Mendes', 'Alves', 'Ribeiro', 'Teixeira', 'Barbosa', 'Cardoso', 'Nunes', 'Vieira', 'Morais', 'Campos'],
  },

  // =========================================================================
  // DIVISION 1 (Level 4) — Authentic Top-Flight Mid-Table Clubs
  // =========================================================================
  {
    id: 'eng_pl_mid',
    region: 'europe',
    country: 'England',
    name: 'Premier League',
    tiers: ['div1'],
    clubs: [
      { name: 'Brighton & Hove Albion', shortName: 'BHA', primaryColor: '#2563eb', secondaryColor: '#ffffff', gkColor: '#f59e0b', stadiumName: 'Amex Stadium' },
      { name: 'Fulham FC', shortName: 'FUL', primaryColor: '#f8fafc', secondaryColor: '#0f172a', gkColor: '#16a34a', stadiumName: 'Craven Cottage' },
      { name: 'Crystal Palace', shortName: 'CRY', primaryColor: '#1e3a8a', secondaryColor: '#dc2626', gkColor: '#eab308', stadiumName: 'Selhurst Park' },
      { name: 'West Ham United', shortName: 'WHU', primaryColor: '#7c1d30', secondaryColor: '#38bdf8', gkColor: '#16a34a', stadiumName: 'London Stadium' },
    ],
    firstNames: ['Danny', 'Lewis', 'Jack', 'Harry', 'Jarrod', 'Eberechi', 'Dean', 'Tyrick', 'James', 'Tom', 'Harrison', 'Adam', 'Emile', 'Marc', 'Solly', 'Aaron'],
    lastNames: ['Welbeck', 'Dunk', 'Hinshelwood', 'Wilson', 'Bowen', 'Eze', 'Henderson', 'Mitchell', 'Ward-Prowse', 'Cairney', 'Reed', 'Wharton', 'Smith Rowe', 'Guéhi', 'March', 'Wan-Bissaka'],
  },
  {
    id: 'ger_bl_mid',
    region: 'europe',
    country: 'Germany',
    name: 'Bundesliga',
    tiers: ['div1'],
    clubs: [
      { name: 'SC Freiburg', shortName: 'SCF', primaryColor: '#dc2626', secondaryColor: '#0f172a', gkColor: '#0284c7', stadiumName: 'Europa-Park Stadion' },
      { name: 'FSV Mainz 05', shortName: 'M05', primaryColor: '#b91c1c', secondaryColor: '#f8fafc', gkColor: '#16a34a', stadiumName: 'MEWA Arena' },
      { name: 'SV Werder Bremen', shortName: 'SVW', primaryColor: '#15803d', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Weserstadion' },
      { name: 'FC Augsburg', shortName: 'FCA', primaryColor: '#f8fafc', secondaryColor: '#dc2626', gkColor: '#0f172a', stadiumName: 'WWK Arena' },
    ],
    firstNames: ['Vincenzo', 'Matthias', 'Christian', 'Jonathan', 'Nadiem', 'Dominik', 'Mitchell', 'Marco', 'Marvin', 'Finn', 'Niklas', 'Maximilian', 'Robin', 'Philipp', 'Jens', 'Arne'],
    lastNames: ['Grifo', 'Ginter', 'Günter', 'Burkardt', 'Amiri', 'Kohr', 'Weiser', 'Friedl', 'Ducksch', 'Dahmen', 'Stark', 'Eggestein', 'Zentner', 'Tietz', 'Stage', 'Maier'],
  },
  {
    id: 'esp_ll_mid',
    region: 'europe',
    country: 'Spain',
    name: 'LaLiga',
    tiers: ['div1'],
    clubs: [
      { name: 'Real Betis', shortName: 'BET', primaryColor: '#16a34a', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Benito Villamarín' },
      { name: 'Villarreal CF', shortName: 'VIL', primaryColor: '#facc15', secondaryColor: '#1e3a8a', gkColor: '#0284c7', stadiumName: 'Estadio de la Cerámica' },
      { name: 'Valencia CF', shortName: 'VAL', primaryColor: '#f8fafc', secondaryColor: '#0f172a', gkColor: '#16a34a', stadiumName: 'Mestalla' },
      { name: 'Sevilla FC', shortName: 'SEV', primaryColor: '#f8fafc', secondaryColor: '#dc2626', gkColor: '#0f172a', stadiumName: 'Ramón Sánchez-Pizjuán' },
    ],
    firstNames: ['Isco', 'Pablo', 'Álex', 'Gerard', 'Dani', 'José', 'Hugo', 'Javi', 'Jesús', 'Isaac', 'Diego', 'Raúl', 'Sergi', 'Marc', 'Ayoze', 'Pepelu'],
    lastNames: ['Alarcón', 'Fornals', 'Baena', 'Moreno', 'Parejo', 'Gayà', 'Duro', 'Guerra', 'Navas', 'Romero', 'Llorente', 'Albiol', 'Cardona', 'Bartra', 'Pérez', 'García'],
  },
  {
    id: 'ita_sa_mid',
    region: 'europe',
    country: 'Italy',
    name: 'Serie A',
    tiers: ['div1'],
    clubs: [
      { name: 'ACF Fiorentina', shortName: 'FIO', primaryColor: '#6d28d9', secondaryColor: '#ffffff', gkColor: '#16a34a', stadiumName: 'Artemio Franchi' },
      { name: 'Bologna FC', shortName: 'BOL', primaryColor: '#991b1b', secondaryColor: '#1e3a8a', gkColor: '#eab308', stadiumName: 'Renato Dall’Ara' },
      { name: 'SS Lazio', shortName: 'LAZ', primaryColor: '#38bdf8', secondaryColor: '#f8fafc', gkColor: '#0f172a', stadiumName: 'Stadio Olimpico' },
      { name: 'Torino FC', shortName: 'TOR', primaryColor: '#7c1d30', secondaryColor: '#ffffff', gkColor: '#0284c7', stadiumName: 'Olimpico Grande Torino' },
    ],
    firstNames: ['Moise', 'Andrea', 'Riccardo', 'Lorenzo', 'Mattia', 'Nicolò', 'Samuele', 'Pietro', 'Danilo', 'Luca', 'Matteo', 'Alessio', 'Tommaso', 'Alessandro', 'Giacomo', 'Ivan'],
    lastNames: ['Kean', 'Colpani', 'Orsolini', 'De Silvestri', 'Zaccagni', 'Rovella', 'Ricci', 'Pellegri', 'Cataldi', 'Ranieri', 'Guendouzi', 'Romagnoli', 'Pobega', 'Buongiorno', 'Lazzari', 'Provedel'],
  },
  {
    id: 'egypt_pl_mid',
    region: 'africa',
    country: 'Egypt',
    name: 'Egyptian Premier League',
    tiers: ['div1'],
    clubs: [
      { name: 'Al Masry SC', shortName: 'MAS', primaryColor: '#15803d', secondaryColor: '#ffffff', gkColor: '#eab308', stadiumName: 'Port Said Stadium' },
      { name: 'Ismaily SC', shortName: 'ISM', primaryColor: '#eab308', secondaryColor: '#1d4ed8', gkColor: '#16a34a', stadiumName: 'Ismailia Stadium' },
      { name: 'Al Ittihad Alexandria', shortName: 'ITH', primaryColor: '#15803d', secondaryColor: '#f8fafc', gkColor: '#0284c7', stadiumName: 'Alexandria Stadium' },
      { name: 'ENPPI SC', shortName: 'ENP', primaryColor: '#1d4ed8', secondaryColor: '#f8fafc', gkColor: '#dc2626', stadiumName: 'Petrosport Stadium' },
    ],
    firstNames: ['Mido', 'Salah', 'Karim', 'Baher', 'Omar', 'Mohamed', 'Ahmed', 'Marwan', 'Amr', 'Mahmoud', 'Hussein', 'Khaled', 'Mostafa', 'Ziad', 'Youssef', 'Nasser'],
    lastNames: ['Gabr', 'Mohsen', 'El-Iraqi', 'El-Mohamady', 'El-Saeed', 'El-Shamy', 'Mabrouk', 'Hamdy', 'El-Deeb', 'Fathy', 'El-Ghandour', 'Mansour', 'Ashour', 'Adel', 'Nabil', 'Kamel'],
  },
  {
    id: 'saudi_pro_mid',
    region: 'asia',
    country: 'Saudi Arabia',
    name: 'Saudi Pro League',
    tiers: ['div1'],
    clubs: [
      { name: 'Al-Ettifaq', shortName: 'ETT', primaryColor: '#15803d', secondaryColor: '#dc2626', gkColor: '#0284c7', stadiumName: 'EGO Stadium Dammam' },
      { name: 'Al-Shabab', shortName: 'SHB', primaryColor: '#f8fafc', secondaryColor: '#0f172a', gkColor: '#eab308', stadiumName: 'Al-Shabab Club Stadium' },
      { name: 'Al-Taawoun', shortName: 'TWN', primaryColor: '#facc15', secondaryColor: '#1d4ed8', gkColor: '#16a34a', stadiumName: 'King Abdullah Sport City' },
      { name: 'Al-Fateh', shortName: 'FAT', primaryColor: '#16a34a', secondaryColor: '#1d4ed8', gkColor: '#dc2626', stadiumName: 'Al-Fateh Club Stadium' },
    ],
    firstNames: ['Abdullah', 'Firas', 'Musab', 'Moteb', 'Nawaf', 'Saad', 'Mourad', 'Rakan', 'Awn', 'Waleed', 'Abdulmalik', 'Turki', 'Hassan', 'Mansour', 'Ali', 'Mohammed'],
    lastNames: ['Al-Malki', 'Al-Buraikan', 'Al-Juwayr', 'Al-Harbi', 'Al-Aqidi', 'Al-Nasser', 'Batna', 'Al-Shamrani', 'Al-Saluli', 'Al-Zaqaan', 'Al-Oyayari', 'Al-Ammar', 'Al-Khaibari', 'Al-Qahtani', 'Al-Ghamdi', 'Al-Sibyani'],
  },
  {
    id: 'usa_mls',
    region: 'americas',
    country: 'USA',
    name: 'Major League Soccer',
    tiers: ['div1'],
    clubs: [
      { name: 'LAFC', shortName: 'LAF', primaryColor: '#0f172a', secondaryColor: '#eab308', gkColor: '#0ea5e9', stadiumName: 'BMO Stadium' },
      { name: 'Inter Miami CF', shortName: 'MIA', primaryColor: '#ec4899', secondaryColor: '#0f172a', gkColor: '#16a34a', stadiumName: 'Chase Stadium' },
      { name: 'Columbus Crew', shortName: 'CLB', primaryColor: '#facc15', secondaryColor: '#0f172a', gkColor: '#0284c7', stadiumName: 'Lower.com Field' },
      { name: 'Seattle Sounders', shortName: 'SEA', primaryColor: '#16a34a', secondaryColor: '#1d4ed8', gkColor: '#f59e0b', stadiumName: 'Lumen Field' },
    ],
    firstNames: ['Jordan', 'Cristian', 'Aidan', 'Diego', 'Darlington', 'Patrick', 'Timothy', 'Walker', 'Matt', 'Keegan', 'Sean', 'Miles', 'Caleb', 'DeJuan', 'Paxten', 'Griffin'],
    lastNames: ['Morris', 'Roldan', 'Morris', 'Rossi', 'Nagbe', 'Schulte', 'Tillman', 'Zimmerman', 'Miazga', 'Rosenberry', 'Zawadzki', 'Robinson', 'Wiley', 'Jones', 'Aaronson', 'Yow'],
  },
  {
    id: 'aus_aleague',
    region: 'australia',
    country: 'Australia',
    name: 'A-League Men',
    tiers: ['div1', 'premier'],
    clubs: [
      { name: 'Sydney FC', shortName: 'SYD', primaryColor: '#38bdf8', secondaryColor: '#0f172a', gkColor: '#f59e0b', stadiumName: 'Allianz Stadium' },
      { name: 'Melbourne Victory', shortName: 'MVC', primaryColor: '#1e3a8a', secondaryColor: '#ffffff', gkColor: '#16a34a', stadiumName: 'AAMI Park' },
      { name: 'Melbourne City', shortName: 'MCY', primaryColor: '#0ea5e9', secondaryColor: '#f8fafc', gkColor: '#eab308', stadiumName: 'AAMI Park' },
      { name: 'Central Coast Mariners', shortName: 'CCM', primaryColor: '#facc15', secondaryColor: '#1e3a8a', gkColor: '#dc2626', stadiumName: 'Industree Group Stadium' },
    ],
    firstNames: ['Anthony', 'Rhyan', 'Jason', 'Mathew', 'Aziz', 'Jamie', 'Nishant', 'Daniel', 'Joshua', 'Bruno', 'Alou', 'Andrew', 'Max', 'Brian', 'Kosta', 'Jordan'],
    lastNames: ['Caceres', 'Grant', 'Geria', 'Leckie', 'Behich', 'Maclaren', 'Velupillay', 'Arzani', 'Nisbet', 'Fornaroli', 'Kuol', 'Redmayne', 'Burgess', 'Kaltak', 'Barbarouses', 'Courtney-Perkins'],
  },

  // =========================================================================
  // NATIONAL PREMIER LEAGUE & CHAMPIONS LEAGUE (Levels 5 & 7) — Real Elite Giants
  // =========================================================================
  {
    id: 'ger_bundesliga_elite',
    region: 'europe',
    country: 'Germany',
    name: 'Bundesliga',
    tiers: ['premier'],
    clubs: [
      {
        name: 'Bayern Munich',
        shortName: 'FCB',
        primaryColor: '#dc2626',
        secondaryColor: '#ffffff',
        gkColor: '#0f172a',
        stadiumName: 'Allianz Arena',
        squadNames: ['Manuel Neuer', 'Joshua Kimmich', 'Dayot Upamecano', 'Kim Min-jae', 'Alphonso Davies', 'Aleksandar Pavlović', 'Leon Goretzka', 'Jamal Musiala', 'Michael Olise', 'Harry Kane', 'Leroy Sané'],
      },
      {
        name: 'Bayer Leverkusen',
        shortName: 'B04',
        primaryColor: '#b91c1c',
        secondaryColor: '#0f172a',
        gkColor: '#16a34a',
        stadiumName: 'BayArena',
        squadNames: ['Lukáš Hrádecký', 'Jonathan Tah', 'Edmond Tapsoba', 'Piero Hincapié', 'Jeremie Frimpong', 'Granit Xhaka', 'Robert Andrich', 'Alejandro Grimaldo', 'Florian Wirtz', 'Victor Boniface', 'Patrik Schick'],
      },
      {
        name: 'Borussia Dortmund',
        shortName: 'BVB',
        primaryColor: '#facc15',
        secondaryColor: '#0f172a',
        gkColor: '#0284c7',
        stadiumName: 'Signal Iduna Park',
        squadNames: ['Gregor Kobel', 'Julian Ryerson', 'Nico Schlotterbeck', 'Waldemar Anton', 'Ramy Bensebaini', 'Emre Can', 'Pascal Groß', 'Julian Brandt', 'Karim Adeyemi', 'Serhou Guirassy', 'Jamie Gittens'],
      },
      {
        name: 'RB Leipzig',
        shortName: 'RBL',
        primaryColor: '#f8fafc',
        secondaryColor: '#dc2626',
        gkColor: '#0ea5e9',
        stadiumName: 'Red Bull Arena',
        squadNames: ['Péter Gulácsi', 'Benjamin Henrichs', 'Willi Orbán', 'Castello Lukeba', 'David Raum', 'Amadou Haidara', 'Kevin Kampl', 'Xavi Simons', 'Dani Olmo', 'Loïs Openda', 'Benjamin Šeško'],
      },
    ],
    firstNames: ['Florian', 'Jamal', 'Joshua', 'Leon', 'Julian', 'Nico', 'Leroy', 'Robert', 'Jonathan', 'Waldemar', 'Pascal', 'David'],
    lastNames: ['Wirtz', 'Musiala', 'Kimmich', 'Goretzka', 'Brandt', 'Schlotterbeck', 'Sané', 'Andrich', 'Tah', 'Anton', 'Groß', 'Raum'],
  },
  {
    id: 'eng_premier_elite',
    region: 'europe',
    country: 'England',
    name: 'Premier League',
    tiers: ['premier'],
    clubs: [
      {
        name: 'Manchester City',
        shortName: 'MCI',
        primaryColor: '#38bdf8',
        secondaryColor: '#ffffff',
        gkColor: '#f59e0b',
        stadiumName: 'Etihad Stadium',
        squadNames: ['Ederson Moraes', 'Kyle Walker', 'Rúben Dias', 'John Stones', 'Joško Gvardiol', 'Rodri Hernández', 'Kevin De Bruyne', 'Bernardo Silva', 'Phil Foden', 'Erling Haaland', 'Jérémy Doku'],
      },
      {
        name: 'Arsenal FC',
        shortName: 'ARS',
        primaryColor: '#dc2626',
        secondaryColor: '#ffffff',
        gkColor: '#0ea5e9',
        stadiumName: 'Emirates Stadium',
        squadNames: ['David Raya', 'Ben White', 'William Saliba', 'Gabriel Magalhães', 'Jurriën Timber', 'Declan Rice', 'Martin Ødegaard', 'Mikel Merino', 'Bukayo Saka', 'Kai Havertz', 'Gabriel Martinelli'],
      },
      {
        name: 'Liverpool FC',
        shortName: 'LIV',
        primaryColor: '#991b1b',
        secondaryColor: '#fef08a',
        gkColor: '#10b981',
        stadiumName: 'Anfield',
        squadNames: ['Alisson Becker', 'Trent Alexander-Arnold', 'Ibrahima Konaté', 'Virgil van Dijk', 'Andy Robertson', 'Ryan Gravenberch', 'Alexis Mac Allister', 'Dominik Szoboszlai', 'Mohamed Salah', 'Darwin Núñez', 'Luis Díaz'],
      },
      {
        name: 'Chelsea FC',
        shortName: 'CHE',
        primaryColor: '#1d4ed8',
        secondaryColor: '#ffffff',
        gkColor: '#eab308',
        stadiumName: 'Stamford Bridge',
        squadNames: ['Robert Sánchez', 'Reece James', 'Wesley Fofana', 'Levi Colwill', 'Marc Cucurella', 'Moisés Caicedo', 'Enzo Fernández', 'Cole Palmer', 'Noni Madueke', 'Nicolas Jackson', 'Pedro Neto'],
      },
    ],
    firstNames: ['Declan', 'Bukayo', 'Phil', 'Cole', 'Trent', 'John', 'Kyle', 'Reece', 'Ollie', 'Anthony', 'Curtis', 'Conor'],
    lastNames: ['Rice', 'Saka', 'Foden', 'Palmer', 'Alexander-Arnold', 'Stones', 'Walker', 'James', 'Watkins', 'Gordon', 'Jones', 'Gallagher'],
  },
  {
    id: 'esp_laliga_elite',
    region: 'europe',
    country: 'Spain',
    name: 'LaLiga',
    tiers: ['premier'],
    clubs: [
      {
        name: 'Real Madrid',
        shortName: 'RMA',
        primaryColor: '#f8fafc',
        secondaryColor: '#eab308',
        gkColor: '#16a34a',
        stadiumName: 'Santiago Bernabéu',
        squadNames: ['Thibaut Courtois', 'Dani Carvajal', 'Éder Militão', 'Antonio Rüdiger', 'Ferland Mendy', 'Federico Valverde', 'Aurélien Tchouaméni', 'Jude Bellingham', 'Rodrygo Goes', 'Kylian Mbappé', 'Vinícius Júnior'],
      },
      {
        name: 'FC Barcelona',
        shortName: 'FCB',
        primaryColor: '#1e3a8a',
        secondaryColor: '#b91c1c',
        gkColor: '#06b6d4',
        stadiumName: 'Spotify Camp Nou',
        squadNames: ['Marc-André ter Stegen', 'Jules Koundé', 'Pau Cubarsí', 'Ronald Araújo', 'Alejandro Balde', 'Marc Casadó', 'Pedri González', 'Dani Olmo', 'Lamine Yamal', 'Robert Lewandowski', 'Raphinha Belloli'],
      },
      {
        name: 'Atlético Madrid',
        shortName: 'ATM',
        primaryColor: '#dc2626',
        secondaryColor: '#1e3a8a',
        gkColor: '#0f172a',
        stadiumName: 'Cívitas Metropolitano',
        squadNames: ['Jan Oblak', 'Nahuel Molina', 'José María Giménez', 'Robin Le Normand', 'Reinildo Mandava', 'Rodrigo De Paul', 'Koke Resurrección', 'Pablo Barrios', 'Marcos Llorente', 'Julián Álvarez', 'Antoine Griezmann'],
      },
      {
        name: 'Athletic Club',
        shortName: 'ATH',
        primaryColor: '#b91c1c',
        secondaryColor: '#f8fafc',
        gkColor: '#0d9488',
        stadiumName: 'San Mamés',
        squadNames: ['Unai Simón', 'Óscar de Marcos', 'Dani Vivian', 'Aitor Paredes', 'Yuri Berchiche', 'Mikel Jauregizar', 'Iñigo Ruiz de Galarreta', 'Oihan Sancet', 'Iñaki Williams', 'Gorka Guruzeta', 'Nico Williams'],
      },
    ],
    firstNames: ['Pedri', 'Gavi', 'Lamine', 'Nico', 'Dani', 'Mikel', 'Unai', 'Pablo', 'Ferran', 'Alejandro', 'Pau', 'Oihan'],
    lastNames: ['González', 'Páez', 'Yamal', 'Williams', 'Carvajal', 'Merino', 'Simón', 'Barrios', 'Torres', 'Balde', 'Cubarsí', 'Sancet'],
  },
  {
    id: 'ita_seriea_elite',
    region: 'europe',
    country: 'Italy',
    name: 'Serie A',
    tiers: ['premier'],
    clubs: [
      {
        name: 'Inter Milan',
        shortName: 'INT',
        primaryColor: '#1d4ed8',
        secondaryColor: '#0f172a',
        gkColor: '#f59e0b',
        stadiumName: 'San Siro',
        squadNames: ['Yann Sommer', 'Benjamin Pavard', 'Francesco Acerbi', 'Alessandro Bastoni', 'Denzel Dumfries', 'Nicolò Barella', 'Hakan Çalhanoğlu', 'Henrikh Mkhitaryan', 'Federico Dimarco', 'Lautaro Martínez', 'Marcus Thuram'],
      },
      {
        name: 'AC Milan',
        shortName: 'MIL',
        primaryColor: '#b91c1c',
        secondaryColor: '#0f172a',
        gkColor: '#0ea5e9',
        stadiumName: 'San Siro',
        squadNames: ['Mike Maignan', 'Emerson Royal', 'Fikayo Tomori', 'Malick Thiaw', 'Theo Hernández', 'Youssouf Fofana', 'Tijjani Reijnders', 'Christian Pulisic', 'Ruben Loftus-Cheek', 'Álvaro Morata', 'Rafael Leão'],
      },
      {
        name: 'Juventus',
        shortName: 'JUV',
        primaryColor: '#0f172a',
        secondaryColor: '#f8fafc',
        gkColor: '#16a34a',
        stadiumName: 'Allianz Stadium Turin',
        squadNames: ['Michele Di Gregorio', 'Andrea Cambiaso', 'Gleison Bremer', 'Federico Gatti', 'Juan Cabal', 'Manuel Locatelli', 'Khéphren Thuram', 'Teun Koopmeiners', 'Kenan Yıldız', 'Dušan Vlahović', 'Francisco Conceição'],
      },
      {
        name: 'SSC Napoli',
        shortName: 'NAP',
        primaryColor: '#0ea5e9',
        secondaryColor: '#ffffff',
        gkColor: '#dc2626',
        stadiumName: 'Stadio Diego Armando Maradona',
        squadNames: ['Alex Meret', 'Giovanni Di Lorenzo', 'Amir Rrahmani', 'Alessandro Buongiorno', 'Mathías Olivera', 'André-Frank Zambo Anguissa', 'Stanislav Lobotka', 'Scott McTominay', 'Matteo Politano', 'Romelu Lukaku', 'Khvicha Kvaratskhelia'],
      },
    ],
    firstNames: ['Nicolò', 'Federico', 'Alessandro', 'Giovanni', 'Manuel', 'Andrea', 'Alex', 'Matteo', 'Davide', 'Giacomo', 'Francesco', 'Michele'],
    lastNames: ['Barella', 'Dimarco', 'Bastoni', 'Di Lorenzo', 'Locatelli', 'Cambiaso', 'Meret', 'Politano', 'Frattesi', 'Raspadori', 'Acerbi', 'Gatti'],
  },
  {
    id: 'egypt_pl_elite',
    region: 'africa',
    country: 'Egypt',
    name: 'Egyptian Premier League',
    tiers: ['premier'],
    clubs: [
      {
        name: 'Al Ahly SC',
        shortName: 'AHL',
        primaryColor: '#c81e1e',
        secondaryColor: '#f8fafc',
        gkColor: '#059669',
        stadiumName: 'Cairo International Stadium',
        squadNames: ['Mohamed El Shenawy', 'Mohamed Hany', 'Rami Rabia', 'Yasser Ibrahim', 'Yahia Attiyat Allah', 'Marwan Attia', 'Emam Ashour', 'Akram Tawfik', 'Hussein El Shahat', 'Wessam Abou Ali', 'Percy Tau'],
      },
      {
        name: 'Zamalek SC',
        shortName: 'ZAM',
        primaryColor: '#f8fafc',
        secondaryColor: '#dc2626',
        gkColor: '#0284c7',
        stadiumName: 'Cairo International Stadium',
        squadNames: ['Mohamed Awad', 'Omar Gaber', 'Hossam Abdelmaguid', 'Hamza Mathlouthi', 'Ahmed Fatouh', 'Nabil Emad Dunga', 'Abdallah El Said', 'Nasser Maher', 'Ahmed Sayed Zizo', 'Seifeddine Jaziri', 'Mustafa Shalaby'],
      },
      {
        name: 'Pyramids FC',
        shortName: 'PYR',
        primaryColor: '#1d4ed8',
        secondaryColor: '#f8fafc',
        gkColor: '#eab308',
        stadiumName: '30 June Stadium',
        squadNames: ['Ahmed El Shenawy', 'Mohamed Chibi', 'Ali Gabr', 'Ahmed Samy', 'Mohamed Hamdy', 'Blati Touré', 'Mohanad Lasheen', 'Walid El Karti', 'Mustafa Fathi', 'Fiston Mayele', 'Ramadan Sobhi'],
      },
    ],
    firstNames: ['Mohamed', 'Ahmed', 'Mostafa', 'Omar', 'Emam', 'Hussein', 'Marwan', 'Rami', 'Yasser', 'Abdallah', 'Nasser', 'Tarek'],
    lastNames: ['El Shenawy', 'Ashour', 'Attia', 'El Shahat', 'Zizo', 'Fathi', 'Rabia', 'Gaber', 'El Said', 'Hamdy', 'Abdelmaguid', 'Tawfik'],
  },
  {
    id: 'morocco_botola_elite',
    region: 'africa',
    country: 'Morocco',
    name: 'Botola Pro',
    tiers: ['premier'],
    clubs: [
      {
        name: 'Wydad AC',
        shortName: 'WAC',
        primaryColor: '#dc2626',
        secondaryColor: '#ffffff',
        gkColor: '#0284c7',
        stadiumName: 'Stade Mohammed V',
        squadNames: ['Youssef El Motie', 'Ayoub El Amloud', 'Jamal Harkass', 'Abdelmounaim Boutouil', 'Yahya Jabrane', 'Oussama Zemraoui', 'Abdallah Haimoud', 'Ismail El Haddad', 'Saifeddine Bouhra', 'Cassius Mailula', 'M’Baye Niang'],
      },
      {
        name: 'Raja CA',
        shortName: 'RCA',
        primaryColor: '#16a34a',
        secondaryColor: '#ffffff',
        gkColor: '#eab308',
        stadiumName: 'Stade Mohammed V',
        squadNames: ['Anas Zniti', 'Mohamed Boulacsout', 'Bouchaib Arrassi', 'Abdullah Khafifi', 'Youssef Belammari', 'Mohamed Zrida', 'Saber Bougrine', 'Adam Ennaffati', 'Yousri Bouzok', 'Nawfel Zerhouni', 'Houssine Rahimi'],
      },
      {
        name: 'AS FAR Rabat',
        shortName: 'FAR',
        primaryColor: '#111827',
        secondaryColor: '#dc2626',
        gkColor: '#0ea5e9',
        stadiumName: 'Prince Moulay Abdellah Stadium',
        squadNames: ['Ayoub El Khayati', 'To Carneiro', 'Hatim Essaouabi', 'Fallou Mendy', 'Rabie Hrimat', 'Larbi Naji', 'Amine Zouhzouh', 'Reda Slim', 'Khalid Ait Ouarkhane', 'Youssef El Fahli', 'Joel Beya'],
      },
    ],
    firstNames: ['Anas', 'Youssef', 'Mohamed', 'Ayoub', 'Yahya', 'Oussama', 'Amine', 'Khalid', 'Adam', 'Soufiane', 'Jamal', 'Reda'],
    lastNames: ['Zniti', 'El Motie', 'Jabrane', 'Harkass', 'Belammari', 'Zrida', 'Bougrine', 'Zouhzouh', 'Rahimi', 'Hrimat', 'El Haddad', 'Slim'],
  },
  {
    id: 'saudi_pro_elite',
    region: 'asia',
    country: 'Saudi Arabia',
    name: 'Saudi Pro League',
    tiers: ['premier'],
    clubs: [
      {
        name: 'Al-Hilal',
        shortName: 'HIL',
        primaryColor: '#1d4ed8',
        secondaryColor: '#ffffff',
        gkColor: '#f59e0b',
        stadiumName: 'Kingdom Arena',
        squadNames: ['Yassine Bounou', 'João Cancelo', 'Kalidou Koulibaly', 'Ali Al-Bulayhi', 'Renan Lodi', 'Rúben Neves', 'Sergej Milinković-Savić', 'Malcom Filipe', 'Salem Al-Dawsari', 'Aleksandar Mitrović', 'Marcos Leonardo'],
      },
      {
        name: 'Al-Nassr',
        shortName: 'NAS',
        primaryColor: '#facc15',
        secondaryColor: '#1e3a8a',
        gkColor: '#16a34a',
        stadiumName: 'Al-Awwal Park',
        squadNames: ['Bento Krepski', 'Sultan Al-Ghannam', 'Mohamed Simakan', 'Aymeric Laporte', 'Nawaf Boushal', 'Marcelo Brozović', 'Otávio Monteiro', 'Abdullah Al-Khaibari', 'Anderson Talisca', 'Cristiano Ronaldo', 'Sadio Mané'],
      },
      {
        name: 'Al-Ittihad',
        shortName: 'ITT',
        primaryColor: '#eab308',
        secondaryColor: '#0f172a',
        gkColor: '#0284c7',
        stadiumName: 'King Abdullah Sports City',
        squadNames: ['Predrag Rajković', 'Muhannad Al-Shanqeeti', 'Abdulelah Al-Amri', 'Danilo Pereira', 'Mario Mitaj', 'N’Golo Kanté', 'Fabinho Tavares', 'Houssem Aouar', 'Moussa Diaby', 'Karim Benzema', 'Steven Bergwijn'],
      },
      {
        name: 'Al-Ahli Saudi',
        shortName: 'AHL',
        primaryColor: '#15803d',
        secondaryColor: '#f8fafc',
        gkColor: '#dc2626',
        stadiumName: 'King Abdullah Sports City',
        squadNames: ['Édouard Mendy', 'Ali Majrashi', 'Roger Ibañez', 'Merih Demiral', 'Saad Balobaid', 'Franck Kessié', 'Ziyad Al-Johani', 'Gabri Veiga', 'Riyad Mahrez', 'Ivan Toney', 'Roberto Firmino'],
      },
    ],
    firstNames: ['Salem', 'Sultan', 'Ali', 'Abdullah', 'Abdulelah', 'Muhannad', 'Ziyad', 'Saad', 'Nawaf', 'Hassan', 'Firas', 'Mohammed'],
    lastNames: ['Al-Dawsari', 'Al-Ghannam', 'Al-Bulayhi', 'Al-Khaibari', 'Al-Amri', 'Al-Shanqeeti', 'Al-Johani', 'Balobaid', 'Al-Tambakti', 'Kanno', 'Al-Buraikan', 'Al-Shahrani'],
  },
  {
    id: 'japan_j1',
    region: 'asia',
    country: 'Japan',
    name: 'J1 League',
    tiers: ['premier', 'div1'],
    clubs: [
      {
        name: 'Vissel Kobe',
        shortName: 'VIS',
        primaryColor: '#881337',
        secondaryColor: '#ffffff',
        gkColor: '#0ea5e9',
        stadiumName: 'Noevir Stadium Kobe',
        squadNames: ['Daiya Maekawa', 'Gotoku Sakai', 'Tetsushi Yamakawa', 'Matheus Thuler', 'Ryo Hatsuse', 'Takahiro Ogihara', 'Hotaru Yamaguchi', 'Haruya Ide', 'Yoshinori Muto', 'Yuya Osako', 'Daiju Sasaki'],
      },
      {
        name: 'Yokohama F. Marinos',
        shortName: 'YFM',
        primaryColor: '#1d4ed8',
        secondaryColor: '#dc2626',
        gkColor: '#eab308',
        stadiumName: 'Nissan Stadium',
        squadNames: ['William Popp', 'Ken Matsubara', 'Shinnosuke Hatanaka', 'Eduardo Santos', 'Katsuya Nagato', 'Kota Watanabe', 'Takuya Kida', 'Jun Amano', 'Yan Matheus', 'Anderson Lopes', 'Elber Silva'],
      },
      {
        name: 'Kawasaki Frontale',
        shortName: 'KAW',
        primaryColor: '#0ea5e9',
        secondaryColor: '#0f172a',
        gkColor: '#16a34a',
        stadiumName: 'Uvance Todoroki Stadium',
        squadNames: ['Jung Sung-ryong', 'Sai van Wermeskerken', 'Jesiel Cardoso', 'Kota Takai', 'Sota Miura', 'Kento Tachibanada', 'Ryota Oshima', 'Yasuto Wakizaka', 'Akihiro Ienaga', 'Shin Yamada', 'Marcinho Silva'],
      },
    ],
    firstNames: ['Yuya', 'Yoshinori', 'Gotoku', 'Hotaru', 'Takuya', 'Kota', 'Yasuto', 'Akihiro', 'Shin', 'Daiya', 'Ken', 'Ryota'],
    lastNames: ['Osako', 'Muto', 'Sakai', 'Yamaguchi', 'Kida', 'Takai', 'Wakizaka', 'Ienaga', 'Yamada', 'Maekawa', 'Matsubara', 'Oshima'],
  },
  {
    id: 'korea_k1',
    region: 'asia',
    country: 'South Korea',
    name: 'K League 1',
    tiers: ['premier', 'div1'],
    clubs: [
      {
        name: 'Ulsan HD',
        shortName: 'ULS',
        primaryColor: '#1d4ed8',
        secondaryColor: '#facc15',
        gkColor: '#10b981',
        stadiumName: 'Ulsan Munsu Stadium',
        squadNames: ['Jo Hyeon-woo', 'Seol Young-woo', 'Kim Young-gwon', 'Hwang Seok-ho', 'Lee Myung-jae', 'Jung Woo-young', 'Ko Seung-beom', 'Lee Dong-gyeong', 'Um Won-sang', 'Joo Min-kyu', 'Gustav Ludwigson'],
      },
      {
        name: 'Jeonbuk Hyundai',
        shortName: 'JEO',
        primaryColor: '#16a34a',
        secondaryColor: '#f8fafc',
        gkColor: '#f97316',
        stadiumName: 'Jeonju World Cup Stadium',
        squadNames: ['Kim Jun-hong', 'Kim Tae-hwan', 'Hong Jeong-ho', 'Park Jin-seob', 'Kim Jin-su', 'Lee Yeong-jae', 'Maeng Seong-ung', 'Lee Seung-woo', 'Song Min-kyu', 'Tiago Orobó', 'Moon Seon-min'],
      },
      {
        name: 'FC Seoul',
        shortName: 'SEO',
        primaryColor: '#b91c1c',
        secondaryColor: '#0f172a',
        gkColor: '#0ea5e9',
        stadiumName: 'Seoul World Cup Stadium',
        squadNames: ['Baek Jong-bum', 'Choi Jun', 'Yazan Al-Arab', 'Kim Ju-sung', 'Kang Sang-woo', 'Ki Sung-yueng', 'Lee Seung-mo', 'Jesse Lingard', 'Cho Young-wook', 'Stanislav Iljutcenko', 'Lucas Silva'],
      },
    ],
    firstNames: ['Hyeon-woo', 'Young-gwon', 'Min-kyu', 'Seung-woo', 'Jin-su', 'Tae-hwan', 'Sang-woo', 'Sung-yueng', 'Young-wook', 'Won-sang', 'Jeong-ho', 'Seon-min'],
    lastNames: ['Jo', 'Kim', 'Joo', 'Lee', 'Park', 'Ki', 'Kang', 'Song', 'Um', 'Hong', 'Choi', 'Jung'],
  },
  {
    id: 'arab_champions',
    region: 'arab',
    country: 'Arab World',
    name: 'Arab Club Champions Cup',
    tiers: ['premier', 'div1'],
    clubs: [
      {
        name: 'Al-Ain FC',
        shortName: 'AIN',
        primaryColor: '#7c3aed',
        secondaryColor: '#f8fafc',
        gkColor: '#f59e0b',
        stadiumName: 'Hazza Bin Zayed Stadium',
        squadNames: ['Khalid Eisa', 'Bandar Al-Ahbabi', 'Kouame Autonne', 'Khalid Al-Hashemi', 'Erik Menezes', 'Park Yong-woo', 'Yahia Nader', 'Matías Palacios', 'Kaku Romero', 'Soufiane Rahimi', 'Kodjo Laba'],
      },
      {
        name: 'Al-Sadd SC',
        shortName: 'SAD',
        primaryColor: '#0f172a',
        secondaryColor: '#f8fafc',
        gkColor: '#0284c7',
        stadiumName: 'Jassim Bin Hamad Stadium',
        squadNames: ['Meshaal Barsham', 'Pedro Miguel', 'Boualem Khoukhi', 'Tarek Salman', 'Paulo Otávio', 'Mohammed Waad', 'Guilherme Torres', 'Hassan Al-Haydos', 'Akram Afif', 'Rafa Mújica', 'Cristo González'],
      },
      {
        name: 'Espérance de Tunis',
        shortName: 'EST',
        primaryColor: '#eab308',
        secondaryColor: '#dc2626',
        gkColor: '#16a34a',
        stadiumName: 'Stade Hammadi Agrebi',
        squadNames: ['Amanallah Memmiche', 'Raed Bouchniba', 'Yassine Meriah', 'Mohamed Tougai', 'Mohamed Ben Hamida', 'Roger Aholou', 'Houssem Tka', 'Yan Sasse', 'Youcef Belaïli', 'Rodrigo Rodrigues', 'Elias Mokwana'],
      },
    ],
    firstNames: ['Akram', 'Hassan', 'Khalid', 'Meshaal', 'Tarek', 'Mohammed', 'Bandar', 'Yassine', 'Youcef', 'Soufiane', 'Yahia', 'Raed'],
    lastNames: ['Afif', 'Al-Haydos', 'Eisa', 'Barsham', 'Salman', 'Waad', 'Al-Ahbabi', 'Meriah', 'Belaïli', 'Rahimi', 'Nader', 'Bouchniba'],
  },
  {
    id: 'bra_seriea_elite',
    region: 'americas',
    country: 'Brazil',
    name: 'Brasileirão Série A',
    tiers: ['premier', 'div1'],
    clubs: [
      {
        name: 'CR Flamengo',
        shortName: 'FLA',
        primaryColor: '#dc2626',
        secondaryColor: '#0f172a',
        gkColor: '#eab308',
        stadiumName: 'Maracanã',
        squadNames: ['Agustín Rossi', 'Wesley França', 'Fabrício Bruno', 'Léo Pereira', 'Alex Sandro', 'Erick Pulgar', 'Gerson Santos', 'Giorgian de Arrascaeta', 'Luiz Araújo', 'Pedro Guilherme', 'Bruno Henrique'],
      },
      {
        name: 'SE Palmeiras',
        shortName: 'PAL',
        primaryColor: '#15803d',
        secondaryColor: '#f8fafc',
        gkColor: '#0284c7',
        stadiumName: 'Allianz Parque',
        squadNames: ['Weverton Pereira', 'Marcos Rocha', 'Gustavo Gómez', 'Murilo Cerqueira', 'Joaquín Piquerez', 'Aníbal Moreno', 'Richard Ríos', 'Raphael Veiga', 'Estêvão Willian', 'Flaco López', 'Felipe Anderson'],
      },
      {
        name: 'Atlético Mineiro',
        shortName: 'CAM',
        primaryColor: '#0f172a',
        secondaryColor: '#f8fafc',
        gkColor: '#16a34a',
        stadiumName: 'Arena MRV',
        squadNames: ['Everson Marques', 'Renzo Saravia', 'Rodrigo Battaglia', 'Junior Alonso', 'Guilherme Arana', 'Otávio Santos', 'Alan Franco', 'Gustavo Scarpa', 'Paulinho Barbosa', 'Hulk Paraíba', 'Eduardo Vargas'],
      },
    ],
    firstNames: ['Pedro', 'Gerson', 'Raphael', 'Guilherme', 'Bruno', 'Gustavo', 'Murilo', 'Marcos', 'Luiz', 'Estêvão', 'Weverton', 'Everson'],
    lastNames: ['Guilherme', 'Santos', 'Veiga', 'Arana', 'Henrique', 'Scarpa', 'Cerqueira', 'Rocha', 'Araújo', 'Willian', 'Pereira', 'Marques'],
  },
  {
    id: 'arg_primera_elite',
    region: 'americas',
    country: 'Argentina',
    name: 'Liga Profesional',
    tiers: ['premier', 'div1'],
    clubs: [
      {
        name: 'River Plate',
        shortName: 'RIV',
        primaryColor: '#f8fafc',
        secondaryColor: '#dc2626',
        gkColor: '#16a34a',
        stadiumName: 'Estadio Monumental',
        squadNames: ['Franco Armani', 'Fabricio Bustos', 'Germán Pezzella', 'Paulo Díaz', 'Marcos Acuña', 'Matías Kranevitter', 'Santiago Simón', 'Claudio Echeverri', 'Franco Mastantuono', 'Miguel Borja', 'Facundo Colidio'],
      },
      {
        name: 'Boca Juniors',
        shortName: 'BOC',
        primaryColor: '#1e3a8a',
        secondaryColor: '#facc15',
        gkColor: '#dc2626',
        stadiumName: 'La Bombonera',
        squadNames: ['Sergio Romero', 'Luis Advíncula', 'Cristian Lema', 'Marcos Rojo', 'Lautaro Blanco', 'Pol Fernández', 'Kevin Zenón', 'Cristian Medina', 'Exequiel Zeballos', 'Edinson Cavani', 'Miguel Merentiel'],
      },
      {
        name: 'Racing Club',
        shortName: 'RAC',
        primaryColor: '#38bdf8',
        secondaryColor: '#ffffff',
        gkColor: '#f59e0b',
        stadiumName: 'El Cilindro',
        squadNames: ['Gabriel Arias', 'Gastón Martirena', 'Marco Di Cesare', 'Agustín García Basso', 'Gabriel Rojas', 'Santiago Sosa', 'Juan Nardoni', 'Agustín Almendra', 'Juanfer Quintero', 'Adrián Martínez', 'Maximiliano Salas'],
      },
    ],
    firstNames: ['Franco', 'Germán', 'Marcos', 'Kevin', 'Cristian', 'Exequiel', 'Facundo', 'Claudio', 'Lautaro', 'Santiago', 'Agustín', 'Gabriel'],
    lastNames: ['Armani', 'Pezzella', 'Acuña', 'Zenón', 'Medina', 'Zeballos', 'Colidio', 'Echeverri', 'Blanco', 'Sosa', 'Almendra', 'Arias'],
  },

  // =========================================================================
  // CHAMPIONS LEAGUE & INTERNATIONAL / WORLD CUP (Levels 6, 7, 8, 9)
  // =========================================================================
  {
    id: 'world_national_teams',
    region: 'europe',
    country: 'International',
    name: 'FIFA International Tournament',
    tiers: ['international'],
    clubs: [
      {
        name: 'Argentina National Team',
        shortName: 'ARG',
        primaryColor: '#38bdf8',
        secondaryColor: '#ffffff',
        gkColor: '#16a34a',
        stadiumName: 'Lusail Iconic Stadium',
        squadNames: ['Emiliano Martínez', 'Nahuel Molina', 'Cristian Romero', 'Lisandro Martínez', 'Nicolás Tagliafico', 'Rodrigo De Paul', 'Enzo Fernández', 'Alexis Mac Allister', 'Lionel Messi', 'Julián Álvarez', 'Lautaro Martínez'],
      },
      {
        name: 'France National Team',
        shortName: 'FRA',
        primaryColor: '#1e3a8a',
        secondaryColor: '#ffffff',
        gkColor: '#eab308',
        stadiumName: 'Stade de France',
        squadNames: ['Mike Maignan', 'Jules Koundé', 'William Saliba', 'Ibrahima Konaté', 'Theo Hernández', 'Aurélien Tchouaméni', 'Eduardo Camavinga', 'N’Golo Kanté', 'Ousmane Dembélé', 'Kylian Mbappé', 'Bradley Barcola'],
      },
      {
        name: 'Spain National Team',
        shortName: 'ESP',
        primaryColor: '#dc2626',
        secondaryColor: '#facc15',
        gkColor: '#0284c7',
        stadiumName: 'Santiago Bernabéu',
        squadNames: ['Unai Simón', 'Dani Carvajal', 'Robin Le Normand', 'Aymeric Laporte', 'Marc Cucurella', 'Rodri Hernández', 'Fabián Ruiz', 'Pedri González', 'Lamine Yamal', 'Álvaro Morata', 'Nico Williams'],
      },
      {
        name: 'Germany National Team',
        shortName: 'GER',
        primaryColor: '#f8fafc',
        secondaryColor: '#0f172a',
        gkColor: '#0ea5e9',
        stadiumName: 'Olympiastadion Berlin',
        squadNames: ['Marc-André ter Stegen', 'Joshua Kimmich', 'Antonio Rüdiger', 'Jonathan Tah', 'Maximilian Mittelstädt', 'Robert Andrich', 'Pascal Groß', 'Florian Wirtz', 'Jamal Musiala', 'Kai Havertz', 'Serge Gnabry'],
      },
      {
        name: 'Brazil National Team',
        shortName: 'BRA',
        primaryColor: '#facc15',
        secondaryColor: '#15803d',
        gkColor: '#0f172a',
        stadiumName: 'Maracanã',
        squadNames: ['Alisson Becker', 'Danilo Luiz', 'Marquinhos Corrêa', 'Gabriel Magalhães', 'Guilherme Arana', 'Bruno Guimarães', 'Lucas Paquetá', 'Gerson Santos', 'Rodrygo Goes', 'Igor Jesus', 'Vinícius Júnior'],
      },
      {
        name: 'England National Team',
        shortName: 'ENG',
        primaryColor: '#f8fafc',
        secondaryColor: '#1e3a8a',
        gkColor: '#16a34a',
        stadiumName: 'Wembley Stadium',
        squadNames: ['Jordan Pickford', 'Kyle Walker', 'John Stones', 'Marc Guéhi', 'Trent Alexander-Arnold', 'Declan Rice', 'Kobbie Mainoo', 'Jude Bellingham', 'Bukayo Saka', 'Harry Kane', 'Phil Foden'],
      },
      {
        name: 'Morocco National Team',
        shortName: 'MAR',
        primaryColor: '#dc2626',
        secondaryColor: '#15803d',
        gkColor: '#0ea5e9',
        stadiumName: 'Prince Moulay Abdellah Stadium',
        squadNames: ['Yassine Bounou', 'Achraf Hakimi', 'Nayef Aguerd', 'Romain Saïss', 'Noussair Mazraoui', 'Sofyan Amrabat', 'Azzedine Ounahi', 'Brahim Díaz', 'Hakim Ziyech', 'Youssef En-Nesyri', 'Abde Ezzalzouli'],
      },
      {
        name: 'Egypt National Team',
        shortName: 'EGY',
        primaryColor: '#c81e1e',
        secondaryColor: '#0f172a',
        gkColor: '#16a34a',
        stadiumName: 'Cairo International Stadium',
        squadNames: ['Mohamed El Shenawy', 'Omar Kamal', 'Mohamed Abdelmonem', 'Rami Rabia', 'Mohamed Hamdy', 'Marwan Attia', 'Hamdy Fathy', 'Emam Ashour', 'Mohamed Salah', 'Mostafa Mohamed', 'Omar Marmoush'],
      },
      {
        name: 'Saudi Arabia National Team',
        shortName: 'KSA',
        primaryColor: '#15803d',
        secondaryColor: '#f8fafc',
        gkColor: '#0284c7',
        stadiumName: 'King Fahd International Stadium',
        squadNames: ['Ahmed Al-Kassar', 'Saud Abdulhamid', 'Ali Al-Bulayhi', 'Hassan Al-Tambakti', 'Nasser Al-Dawsari', 'Abdulelah Al-Malki', 'Mohamed Kanno', 'Musab Al-Juwayr', 'Salem Al-Dawsari', 'Firas Al-Buraikan', 'Saleh Al-Shehri'],
      },
      {
        name: 'Japan National Team',
        shortName: 'JPN',
        primaryColor: '#1d4ed8',
        secondaryColor: '#f8fafc',
        gkColor: '#eab308',
        stadiumName: 'Japan National Stadium',
        squadNames: ['Zion Suzuki', 'Yukinari Sugawara', 'Ko Itakura', 'Koki Machida', 'Hiroki Ito', 'Wataru Endo', 'Hidemasa Morita', 'Takefusa Kubo', 'Ritsu Doan', 'Ayase Ueda', 'Kaoru Mitoma'],
      },
    ],
    firstNames: ['Lionel', 'Kylian', 'Jude', 'Lamine', 'Florian', 'Mohamed', 'Salem', 'Achraf', 'Takefusa', 'Vinícius'],
    lastNames: ['Messi', 'Mbappé', 'Bellingham', 'Yamal', 'Wirtz', 'Salah', 'Al-Dawsari', 'Hakimi', 'Kubo', 'Júnior'],
  },
];

export interface GeneratedMatchFixture {
  league: LeagueDef;
  home: ClubDef;
  away: ClubDef;
  homeRoster: Array<{ number: number; name: string }>;
  awayRoster: Array<{ number: number; name: string }>;
  stadiumName: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRoster(league: LeagueDef, club?: ClubDef): Array<{ number: number; name: string }> {
  const numbers = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 14];
  if (club?.squadNames && club.squadNames.length >= 11) {
    return numbers.map((num, idx) => ({
      number: num,
      name: club.squadNames![idx],
    }));
  }

  const used = new Set<string>();
  return numbers.map((num) => {
    let full = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = `${pickRandom(league.firstNames)} ${pickRandom(league.lastNames)}`;
      if (!used.has(candidate)) {
        full = candidate;
        used.add(candidate);
        break;
      }
    }
    if (!full) full = `${pickRandom(league.firstNames)} ${pickRandom(league.lastNames)}`;
    return { number: num, name: full };
  });
}

function divisionToTier(divisionId: DivisionId): ClubTier {
  switch (divisionId) {
    case 'div4':
      return 'div4';
    case 'div3':
      return 'div3';
    case 'div2':
      return 'div2';
    case 'div1':
      return 'div1';
    case 'premier':
    case 'champions':
      return 'premier';
    case 'international':
    case 'worldcup':
    case 'worldcup_final':
      return 'international';
  }
}

export function generateFixtureForDivision(divisionId: DivisionId, preferredRegion?: RegionId): GeneratedMatchFixture {
  const tier = divisionToTier(divisionId);

  // International / World Cup / World Cup Final -> Authentic National Teams
  if (tier === 'international') {
    const intlLeague = REGION_LEAGUES.find((l) => l.tiers.includes('international'))!;
    const homeIdx = Math.floor(Math.random() * intlLeague.clubs.length);
    const awayIdx = (homeIdx + 1 + Math.floor(Math.random() * (intlLeague.clubs.length - 1))) % intlLeague.clubs.length;
    const home = intlLeague.clubs[homeIdx];
    let away = intlLeague.clubs[awayIdx];
    if (home.primaryColor === away.primaryColor) {
      away = { ...away, primaryColor: away.secondaryColor === '#ffffff' ? '#f59e0b' : '#0f172a' };
    }
    return {
      league: {
        ...intlLeague,
        name:
          divisionId === 'worldcup_final'
            ? 'FIFA World Cup Final'
            : divisionId === 'worldcup'
            ? 'FIFA World Cup'
            : 'International Friendly / Nations Cup',
      },
      home,
      away,
      homeRoster: generateRoster(intlLeague, home),
      awayRoster: generateRoster(intlLeague, away),
      stadiumName:
        divisionId === 'worldcup_final'
          ? 'Lusail Iconic World Cup Final Stadium'
          : divisionId === 'worldcup'
          ? 'FIFA World Cup Showcase Arena'
          : home.stadiumName,
    };
  }

  // Champions League -> Cross-league clash between European/Elite giants
  if (divisionId === 'champions') {
    const uclLeagues = REGION_LEAGUES.filter(
      (l) => l.tiers.includes('premier') && l.region === 'europe'
    );
    const leagueA = pickRandom(uclLeagues);
    let leagueB = pickRandom(uclLeagues);
    if (leagueB.id === leagueA.id && uclLeagues.length > 1) {
      leagueB = uclLeagues[(uclLeagues.indexOf(leagueA) + 1) % uclLeagues.length];
    }
    const home = pickRandom(leagueA.clubs);
    let away = pickRandom(leagueB.clubs);
    if (home.primaryColor === away.primaryColor) {
      away = { ...away, primaryColor: away.secondaryColor === '#ffffff' ? '#f59e0b' : '#0f172a' };
    }
    return {
      league: { ...leagueA, name: 'UEFA Champions League' },
      home,
      away,
      homeRoster: generateRoster(leagueA, home),
      awayRoster: generateRoster(leagueB, away),
      stadiumName: home.stadiumName,
    };
  }

  // Strictly match leagues to the current Career Division tier so giants NEVER appear in Div 4!
  let tierPool = REGION_LEAGUES.filter((l) => l.tiers.includes(tier));
  if (preferredRegion) {
    const regionalTierPool = tierPool.filter((l) => l.region === preferredRegion);
    if (regionalTierPool.length > 0) {
      tierPool = regionalTierPool;
    }
  }
  if (tierPool.length === 0) {
    tierPool = REGION_LEAGUES.filter((l) => l.tiers.includes('div4'));
  }

  const league = pickRandom(tierPool);
  const homeIdx = Math.floor(Math.random() * league.clubs.length);
  const awayIdx = (homeIdx + 1 + Math.floor(Math.random() * (league.clubs.length - 1))) % league.clubs.length;
  const home = league.clubs[homeIdx];
  let away = league.clubs[awayIdx];
  if (home.primaryColor === away.primaryColor) {
    away = { ...away, primaryColor: away.secondaryColor === '#ffffff' ? '#f59e0b' : '#0f172a' };
  }

  return {
    league,
    home,
    away,
    homeRoster: generateRoster(league, home),
    awayRoster: generateRoster(league, away),
    stadiumName: home.stadiumName,
  };
}
