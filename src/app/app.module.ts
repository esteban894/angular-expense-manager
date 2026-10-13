import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeModule } from './modules/home/home.module';
import { NavbarComponent } from './modules/home/components/navbar/navbar.component';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { ToastComponent } from './shared/toast/toast.component';

registerLocaleData(localeEsAr);

@NgModule({
  declarations: [AppComponent, ToastComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, HomeModule],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-AR' },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
