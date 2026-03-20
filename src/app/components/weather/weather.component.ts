import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { WeatherService } from './../../service/weather.service';
import { WeatherData } from '../../models/weather.model';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      transition(':enter', [
        animate('500ms ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('bounce', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class WeatherComponent implements OnInit, OnDestroy {
  weatherData: WeatherData | null = null;
  city = '';
  errorMessage = '';
  isLoading = false;

  private readonly weatherService = inject(WeatherService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.weatherService.weather$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.weatherData = data ?? null;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchWeather(): void {
    const city = this.city.trim();
    if (!city) {
      this.errorMessage = 'Please enter city';
      this.weatherData = null;
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.weatherService.getWeather(city)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => {
          this.weatherData = data;
        },
        error: (err) => {
          console.error('Component error fetching weather', err);
          this.errorMessage = 'City not found. Try again!';
          this.weatherData = null;
        },
      });
  }
}