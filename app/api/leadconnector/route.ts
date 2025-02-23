import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    
    // Get environment variables
    const locationId = process.env.HIGHLEVEL_LOCATION_ID;
    const apiKey = process.env.HIGHLEVEL_PIT_API_KEY;

    if (!locationId || !apiKey) {
      return new NextResponse("Missing LeadConnector configuration", { status: 500 });
    }

    // Map the form data to LeadConnector contact format
    const contactData = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "",
      email: user.emailAddresses[0]?.emailAddress || "",
      locationId: locationId,
      phone: body.phone || "",
      companyName: body.companyName || "",
      customFields: [
        {
          key: "business_name",
          field_value: body.companyName || ""
        },
        {
          key: "any",
          field_value: ""
        },
        {
          key: "any",
          field_value: ""
        },
        {
          key: "any",
          field_value: ""
        },
        {
          key: "which_of_the_following_best_describes_you",
          field_value: body.businessType || ""
        }
      ],
      source: "LogoX App"
    };

    // Make request to LeadConnector API
    const response = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("LeadConnector API error:", error);
      return new NextResponse("Failed to create contact", { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in LeadConnector integration:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 