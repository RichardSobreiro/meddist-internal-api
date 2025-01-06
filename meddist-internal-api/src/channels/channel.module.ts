import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Channel])],
  controllers: [ChannelController],
  providers: [ChannelService],
})
export class ChannelModule {}
