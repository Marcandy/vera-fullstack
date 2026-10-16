package com.vera.api.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {
    // Only browser routes reach the SPA. API and missing asset paths retain their
    // server responses instead of silently returning an HTML document.
    @GetMapping({"/about", "/dashboard", "/visits", "/visits/{id}", "/billing",
            "/caregivers", "/caregivers/{id}", "/patients", "/patients/{id}",
            "/my-visits", "/my-documents", "/caregiver/visits/{id}"})
    public String frontend() {
        return "forward:/index.html";
    }
}
