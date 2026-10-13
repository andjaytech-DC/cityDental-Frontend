import type { Metadata } from "next";

export const metadata: Metadata = { title: "What to Expect | CityDental", description: "A general overview of what happens during a typical visit to CityDental." };

export default function WhatToExpectPage() {
  return (
    <div className="patient-resource-detail">
      <section className="premium-section premium-wrap">
        <div className="cd-page-heading"><h1>What to Expect</h1><p>A general overview of what happens during a typical visit to CityDental.</p></div>
        <div className="resource-content">
          <p>At CityDental, we aim to make every visit comfortable and productive. Here is a general overview of what you can expect during your appointment.</p>
          <h2>During Your Visit</h2>
          <ol>
            <li>Check-in and welcome</li>
            <li>Review of your health history</li>
            <li>Comprehensive examination</li>
            <li>Discussion of findings and treatment options</li>
            <li>Personalized care plan</li>
          </ol>
          <p>We will take the time to answer all your questions and ensure you understand each step of your care.</p>
          <div className="resource-cta">
            <a href="/book-appointment" className="cd-button cd-button-primary">Book an Appointment <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
    </div>
  );
}
