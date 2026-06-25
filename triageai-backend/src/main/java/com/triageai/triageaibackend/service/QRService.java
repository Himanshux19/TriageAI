package com.triageai.triageaibackend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;

@Service
public class QRService {

    private static final String QR_DIR = "uploads/qr/";

    public String generateQRCode(String clinicId) throws Exception {
        String content = "http://localhost:8080/patient/book/" + clinicId;

        MultiFormatWriter writer = new MultiFormatWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 300, 300,
                Map.of(EncodeHintType.MARGIN, 2));

        Files.createDirectories(Paths.get(QR_DIR));
        String filename = "qr_" + clinicId + ".png";
        String filePath = QR_DIR + filename;

        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        ImageIO.write(image, "PNG", new File(filePath));

        // Also return base64 for inline display
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());

        return base64;
    }
}
