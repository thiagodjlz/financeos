import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './core/toast/toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
