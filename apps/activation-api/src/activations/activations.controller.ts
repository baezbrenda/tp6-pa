import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ActivationsService } from './activations.service';
import { CreateActivationDto } from './create-activation.dto';

@Controller('activations')
export class ActivationsController {
  constructor(private readonly service: ActivationsService) {}

  @Post()
  @HttpCode(202)
  create(@Body() dto: CreateActivationDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.service.findOne(id);
  }
}