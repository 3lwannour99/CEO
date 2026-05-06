import { Module } from '@nestjs/common';
import { CounterScreenService } from './counterscreen.service';

@Module({
    exports: [CounterScreenService],
    providers: [CounterScreenService],
})
export class CounterScreenModule {}
