/**
 * Curated seed list of popular "X vs Y" queries worth pre-generating so
 * Google has pages to index on first crawl. Tilted toward real search-
 * volume purchase decisions and cultural matchups.
 *
 * Each pair becomes a cached comparison at /vs/<slug> when the admin
 * seed endpoint runs.
 */
export const SEED_COMPARISONS: Array<[string, string]> = [
  // Phones
  ['iPhone 15 Pro', 'Samsung Galaxy S24 Ultra'],
  ['iPhone 15', 'iPhone 15 Pro'],
  ['iPhone 15 Pro', 'Pixel 8 Pro'],
  ['Pixel 8', 'Pixel 8 Pro'],
  ['iPhone 15 Plus', 'iPhone 15 Pro Max'],
  ['iPhone 14 Pro', 'iPhone 15 Pro'],

  // Laptops
  ['MacBook Air M3', 'MacBook Pro M3'],
  ['MacBook Air M2', 'MacBook Air M3'],
  ['MacBook Air', 'Dell XPS 13'],
  ['Framework Laptop 13', 'MacBook Air M3'],
  ['ThinkPad X1 Carbon', 'MacBook Pro 14'],

  // Headphones / audio
  ['Sony WH-1000XM5', 'Bose QuietComfort Ultra'],
  ['AirPods Pro 2', 'Sony WF-1000XM5'],
  ['AirPods Pro 2', 'Beats Fit Pro'],
  ['AirPods Max', 'Sony WH-1000XM5'],

  // Tablets / e-readers
  ['iPad Air', 'iPad Pro'],
  ['iPad', 'iPad Air'],
  ['Kindle Paperwhite', 'Kindle Oasis'],
  ['Kindle', 'Kobo Clara'],

  // Smartwatches
  ['Apple Watch Series 9', 'Apple Watch Ultra 2'],
  ['Apple Watch', 'Garmin Fenix 7'],
  ['Garmin Forerunner 265', 'Garmin Forerunner 965'],

  // Home
  ['Roomba j9+', 'Shark Matrix'],
  ['Dyson V15', 'Shark Cordless'],
  ['Nespresso Vertuo', 'Keurig K-Supreme'],
  ['Breville Barista Express', 'De\u2019Longhi Dedica'],

  // Gaming
  ['PS5', 'Xbox Series X'],
  ['Steam Deck OLED', 'ROG Ally X'],
  ['Nintendo Switch OLED', 'Steam Deck'],

  // Cars / EVs
  ['Tesla Model Y', 'Hyundai Ioniq 5'],
  ['Tesla Model 3', 'Toyota Prius'],
  ['Tesla Model 3', 'BMW i4'],
  ['Rivian R1S', 'Kia EV9'],
  ['Honda CR-V', 'Toyota RAV4'],

  // Food / drink
  ['New York pizza', 'Chicago deep dish'],
  ['In-N-Out', 'Shake Shack'],
  ['Five Guys', 'In-N-Out'],
  ['Chipotle', 'Cava'],
  ['Starbucks', 'Dunkin'],
  ['Sushi', 'Ramen'],

  // Life decisions
  ['Rent', 'Buy a house'],
  ['Remote work', 'In-office work'],
  ['Adopt a cat', 'Adopt a dog'],
  ['CrossFit', 'Orangetheory'],
  ['Peloton', 'Gym membership'],

  // Travel / destinations
  ['Tokyo', 'Seoul'],
  ['Paris', 'Rome'],
  ['Lisbon', 'Barcelona'],
  ['Banff', 'Yellowstone'],
  ['New Zealand', 'Iceland'],
  ['Bali', 'Phuket'],

  // Sports / people
  ['Lionel Messi', 'Cristiano Ronaldo'],
  ['LeBron James', 'Michael Jordan'],
  ['Tom Brady', 'Patrick Mahomes'],
  ['Serena Williams', 'Steffi Graf'],
  ['Shohei Ohtani', 'Babe Ruth'],

  // Streaming / subscriptions
  ['Netflix', 'Disney+'],
  ['Spotify', 'Apple Music'],
  ['Max', 'Hulu'],
  ['ChatGPT Plus', 'Claude Pro'],

  // Software tools
  ['Notion', 'Obsidian'],
  ['Linear', 'Jira'],
  ['VS Code', 'Cursor'],
  ['Figma', 'Sketch'],

  // Fictional / media
  ['Marvel', 'DC'],
  ['Lord of the Rings', 'Game of Thrones'],
  ['Star Wars', 'Star Trek'],
  ['Harry Potter', 'Percy Jackson'],

  // Brand / classic
  ['Coke', 'Pepsi'],
  ['McDonald\u2019s', 'Burger King'],
  ['Nike', 'Adidas'],
  ['Apple', 'Samsung'],

  // Careers
  ['Software engineer', 'Product manager'],
  ['Startup', 'Big tech'],
  ['MBA', 'PhD'],

  // Fitness
  ['Running', 'Cycling'],
  ['Strength training', 'Cardio'],
  ['Yoga', 'Pilates'],
]
