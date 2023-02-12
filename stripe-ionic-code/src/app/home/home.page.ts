import { environment } from './../../environments/environment';
import { Component } from '@angular/core';
import { ApplePayEventsEnum, GooglePayEventsEnum, PaymentFlowEventsEnum, PaymentSheetEventsEnum, Stripe } from '@capacitor-community/stripe';
import { HttpClient, HttpParams } from '@angular/common/http';
import { first, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  data: any = {
    name: 'Nikhil',
    email: 'nykz786@gmail.com',
    amount: 100,
    currency: 'inr'
  };

  constructor(private http: HttpClient) {
    Stripe.initialize({
      publishableKey: environment.stripe.publishableKey,
    });
  }

  httpPost(body) {
    return this.http.post<any>(environment.api + 'payment-sheet', body).pipe(first());
  }

  async paymentSheet() {
    /*
    With PaymentSheet, you can make payments in a single flow. 
    As soon as the User presses the payment button, 
    the payment is completed. (If you want user have some flow after that, 
    please use paymentFlow method)
    */

    try {
      // be able to get event of PaymentSheet
      Stripe.addListener(PaymentSheetEventsEnum.Completed, () => {
        console.log('PaymentSheetEventsEnum.Completed');
      });
    
      // const data = new HttpParams({
      //   fromObject: this.data
      // });
      // Connect to your backend endpoint, and get every key.
      const data$ = this.httpPost(this.data);

      const { paymentIntent, ephemeralKey, customer } = await lastValueFrom(data$);

      console.log('paymentIntent: ', paymentIntent);

      // prepare PaymentSheet with CreatePaymentSheetOption.
      await Stripe.createPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        merchantDisplayName: 'Technyks'
      });

      console.log('createPaymentSheet');
      // present PaymentSheet and get result.
      const result = await Stripe.presentPaymentSheet();
      console.log('result: ', result);
      if (result && result.paymentResult === PaymentSheetEventsEnum.Completed) {
        // Happy path
        this.splitAndJoin(paymentIntent);
      }
    } catch(e) {
      console.log(e);
    }
  }

  async paymentFlow() {
    /* 
    With PaymentFlow, you can make payments in two steps flow. 
    When the user presses the submit button, 
    the system only gets the card information, 
    and puts it in a pending state. 
    After that, when the program executes the confirmation method, 
    the payment is executed. In most cases, 
    it is used in a flow that is interrupted by a final confirmation screen.
    */

    // be able to get event of PaymentFlow
    Stripe.addListener(PaymentFlowEventsEnum.Completed, () => {
      console.log('PaymentFlowEventsEnum.Completed');
    });
    
    // const data = new HttpParams({
    //   fromObject: this.data
    // });
  
    // Connect to your backend endpoint, and get every key.
    // const data$ = this.http.post<{
    //   paymentIntent: string;
    //   ephemeralKey: string;
    //   customer: string;
    // }>(environment.api + 'payment-sheet', data).pipe(first());

    const data$ = this.httpPost(this.data);

    const {paymentIntent, ephemeralKey, customer} = await lastValueFrom(data$);

    // Prepare PaymentFlow with CreatePaymentFlowOption.
    await Stripe.createPaymentFlow({
      paymentIntentClientSecret: paymentIntent,
      // setupIntentClientSecret: setupIntent,
      customerEphemeralKeySecret: ephemeralKey,
      customerId: customer,
      merchantDisplayName: 'Technyks'
    });

    // Present PaymentFlow. **Not completed yet.**
    const presentResult = await Stripe.presentPaymentFlow();
    console.log('presentResult: ', presentResult); // { cardNumber: "●●●● ●●●● ●●●● ****" }

    // Confirm PaymentFlow. Completed.
    const confirmResult = await Stripe.confirmPaymentFlow();
    console.log('confirmResult: ', confirmResult);
    if (confirmResult.paymentResult === PaymentFlowEventsEnum.Completed) {
      // Happy path
      this.splitAndJoin(paymentIntent);
    }
  }

  async applePay() {
      // Check to be able to use Apple Pay on device
    const isAvailable = Stripe.isApplePayAvailable().catch(() => undefined);
    if (isAvailable === undefined) {
      // disable to use Google Pay
      return;
    }

    // be able to get event of Apple Pay
    Stripe.addListener(ApplePayEventsEnum.Completed, () => {
      console.log('ApplePayEventsEnum.Completed');
    });
    
    // const data = new HttpParams({
    //   fromObject: this.data
    // });
    
    // Connect to your backend endpoint, and get paymentIntent.
    // const data$ = this.http.post<{
    //   paymentIntent: string;
    // }>(environment.api + 'payment-sheet', data).pipe(first());

    const data$ = this.httpPost(this.data);

    const { paymentIntent } = await lastValueFrom(data$);

    // Prepare Apple Pay
    await Stripe.createApplePay({
      paymentIntentClientSecret: paymentIntent,
      paymentSummaryItems: [{
        label: 'Technyks',
        amount: 1099.00
      }],
      merchantIdentifier: 'technyks',
      countryCode: 'IN',
      currency: 'INR',
    });

    // Present Apple Pay
    const result = await Stripe.presentApplePay();
    if (result.paymentResult === ApplePayEventsEnum.Completed) {
      // Happy path
      this.splitAndJoin(paymentIntent);
    }
  }

  async googlePay() {
    // Check to be able to use Google Pay on device
    const isAvailable = Stripe.isGooglePayAvailable().catch(() => undefined);
    if (isAvailable === undefined) {
      // disable to use Google Pay
      return;
    }
  
    Stripe.addListener(GooglePayEventsEnum.Completed, () => {
      console.log('GooglePayEventsEnum.Completed');
    });
    
    // const data = new HttpParams({
    //   fromObject: this.data
    // });
    
    // Connect to your backend endpoint, and get paymentIntent.
    // const data$= this.http.post<{
    //   paymentIntent: string;
    // }>(environment.api + 'payment-sheet', data).pipe(first());

    const data$ = this.httpPost(this.data);

    const { paymentIntent } = await lastValueFrom(data$);

    // Prepare Google Pay
    await Stripe.createGooglePay({
      paymentIntentClientSecret: paymentIntent,

      // Web only. Google Pay on Android App doesn't need
      paymentSummaryItems: [{
        label: 'Technyks',
        amount: 1099.00
      }],
      merchantIdentifier: 'merchant.com.getcapacitor.stripe',
      countryCode: 'IN',
      currency: 'INR',
    });

    // Present Google Pay
    const result = await Stripe.presentGooglePay();
    if (result.paymentResult === GooglePayEventsEnum.Completed) {
      // Happy path
      this.splitAndJoin(paymentIntent);
    }
  }

  splitAndJoin(paymentIntent) {
    const result = paymentIntent.split('_').slice(0, 2).join('_');
    console.log(result);
    return result;
  }

}
