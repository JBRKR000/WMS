package com.kozimor.wms.Database.Service;

import org.springframework.stereotype.Service;

@Service
public class UserIDGenerator {
    private static final String PREFIX = "u_";
    private static final int ID_LENGTH = 4;
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnoprstuwxyz0123456789";
    public String generateUserID() {
        StringBuilder userID = new StringBuilder(PREFIX);
        for (int i = 0; i < ID_LENGTH; i++) {
            int randomIndex = (int) (Math.random() * CHARACTERS.length());
            userID.append(CHARACTERS.charAt(randomIndex));
        }
        return userID.toString();
    }
}
