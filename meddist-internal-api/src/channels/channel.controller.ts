import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';

@Controller('channels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  @Roles('admin', 'channels_manager')
  async create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelService.create(createChannelDto);
  }

  @Get()
  @Roles('admin', 'channels_viewer')
  async findAll() {
    return this.channelService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'channels_viewer')
  async findOne(@Param('id') id: string) {
    return this.channelService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'channels_manager')
  async update(
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelService.update(id, updateChannelDto);
  }

  @Delete(':id')
  @Roles('admin', 'channels_manager')
  async remove(@Param('id') id: string) {
    return this.channelService.remove(id);
  }
}
