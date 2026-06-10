import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/user.entity';
import * as bcrypt from 'bcrypt';

config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [User],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

const seeds = [
  {
    email: 'admin@authsystem.com',
    password: 'Admin@123456',
    role: 'admin',
  },
  {
    email: 'user@authsystem.com',
    password: 'User@123456',
    role: 'user',
  },
];

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepository = AppDataSource.getRepository(User);

    for (const seed of seeds) {
      const exists = await userRepository.findOne({
        where: { email: seed.email },
      });

      if (exists) {
        console.log(`User ${seed.email} already exists — skipping`);
        continue;
      }

      const hashed = await bcrypt.hash(seed.password, 12);
      const user = userRepository.create({
        email: seed.email,
        password: hashed,
        role: seed.role,
      });

      await userRepository.save(user);
      console.log(`Created user: ${seed.email} (${seed.role})`);
    }

    console.log('Seeding complete');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();