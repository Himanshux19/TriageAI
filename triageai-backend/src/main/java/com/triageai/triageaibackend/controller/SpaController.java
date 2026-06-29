package com.triageai.triageaibackend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {
    @RequestMapping(value = { "/", "/patient/**", "/clinic/**", "/doctor/**", "/reset-password" })
    public String index() {
        return "forward:/index.html";
    }
}