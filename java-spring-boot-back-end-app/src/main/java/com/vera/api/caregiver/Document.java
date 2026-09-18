package com.vera.api.caregiver;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// A record of receipt, not a status. Expiring and cleared-to-work are derived
// in the DTO and the React utils from these fields plus a clock.
@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caregiver_id", nullable = false)
    private Caregiver caregiver;

    // Checklist label: State ID, Background Check, CPR Certification, TB Test.
    // Identity is this row's id, never the name.
    @Column(nullable = false)
    private String name;

    private Instant issuedAt;
    private Instant expiresAt;
    private String signature;
    private String fileName;
    private Integer fileSize;
    private String fileType;
    private Instant receivedAt;

    // A renewal waiting on the office. Null pendingSubmittedAt means nothing
    // waits, which the DTO maps as submission: null.
    private String pendingFileName;
    private Integer pendingFileSize;
    private String pendingFileType;
    private Instant pendingIssuedAt;
    private Instant pendingExpiresAt;
    private Instant pendingSubmittedAt;

    protected Document() {
    }

    public Document(Caregiver caregiver, String name) {
        this.caregiver = caregiver;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public Caregiver getCaregiver() {
        return caregiver;
    }

    public void setCaregiver(Caregiver caregiver) {
        this.caregiver = caregiver;
    }

    public String getName() {
        return name;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(Instant issuedAt) {
        this.issuedAt = issuedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Integer getFileSize() {
        return fileSize;
    }

    public void setFileSize(Integer fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Instant receivedAt) {
        this.receivedAt = receivedAt;
    }

    public String getPendingFileName() {
        return pendingFileName;
    }

    public Integer getPendingFileSize() {
        return pendingFileSize;
    }

    public String getPendingFileType() {
        return pendingFileType;
    }

    public Instant getPendingIssuedAt() {
        return pendingIssuedAt;
    }

    public Instant getPendingExpiresAt() {
        return pendingExpiresAt;
    }

    public Instant getPendingSubmittedAt() {
        return pendingSubmittedAt;
    }

    public void setPendingFileName(String pendingFileName) {
        this.pendingFileName = pendingFileName;
    }

    public void setPendingFileSize(Integer pendingFileSize) {
        this.pendingFileSize = pendingFileSize;
    }

    public void setPendingFileType(String pendingFileType) {
        this.pendingFileType = pendingFileType;
    }

    public void setPendingIssuedAt(Instant pendingIssuedAt) {
        this.pendingIssuedAt = pendingIssuedAt;
    }

    public void setPendingExpiresAt(Instant pendingExpiresAt) {
        this.pendingExpiresAt = pendingExpiresAt;
    }

    public void setPendingSubmittedAt(Instant pendingSubmittedAt) {
        this.pendingSubmittedAt = pendingSubmittedAt;
    }

    // Empties the whole submission slot. All six fields move together or the
    // record starts claiming a renewal is waiting with nothing in it, so this
    // is one state change rather than six calls a caller can half finish. It
    // decides nothing: WHEN a submission is cleared is the service's call.
    public void clearPendingSubmission() {
        this.pendingFileName = null;
        this.pendingFileSize = null;
        this.pendingFileType = null;
        this.pendingIssuedAt = null;
        this.pendingExpiresAt = null;
        this.pendingSubmittedAt = null;
    }
}
