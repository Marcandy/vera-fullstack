-- Schema only. Demo accounts and records are initialized by the operator tool.
CREATE TABLE patients (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    address VARCHAR(255),
    phone VARCHAR(255),
    standing_concerns VARCHAR(2000),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE caregivers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    phone VARCHAR(255),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    caregiver_id BIGINT,
    enabled BIT(1) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_caregiver UNIQUE (caregiver_id),
    CONSTRAINT fk_users_caregiver FOREIGN KEY (caregiver_id) REFERENCES caregivers (id),
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'CAREGIVER'))
) ENGINE=InnoDB;

CREATE TABLE visits (
    id BIGINT NOT NULL AUTO_INCREMENT,
    patient_id BIGINT,
    caregiver_id BIGINT,
    appointment_time DATETIME(6) NOT NULL,
    status VARCHAR(255),
    service_type VARCHAR(255),
    estimated_cost DECIMAL(10,2),
    check_in_time DATETIME(6),
    check_out_time DATETIME(6),
    check_in_latitude DOUBLE,
    check_in_longitude DOUBLE,
    check_in_accuracy DOUBLE,
    check_in_location_reason VARCHAR(255),
    assessment VARCHAR(2000),
    signature VARCHAR(255),
    patient_concern VARCHAR(2000),
    PRIMARY KEY (id),
    CONSTRAINT fk_visits_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_visits_caregiver FOREIGN KEY (caregiver_id) REFERENCES caregivers (id),
    CONSTRAINT ck_visits_status CHECK (status IN
        ('SCHEDULED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'READY_TO_BILL', 'BILLED', 'CANCELLED')),
    CONSTRAINT ck_visits_service_type CHECK (service_type IN
        ('PERSONAL_CARE', 'HOMEMAKER', 'COMPANION_CARE', 'RESPITE_CARE'))
) ENGINE=InnoDB;

CREATE TABLE claims (
    id BIGINT NOT NULL AUTO_INCREMENT,
    visit_id BIGINT NOT NULL,
    reference VARCHAR(40) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    submitted_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_claims_visit UNIQUE (visit_id),
    CONSTRAINT uk_claims_reference UNIQUE (reference),
    CONSTRAINT fk_claims_visit FOREIGN KEY (visit_id) REFERENCES visits (id)
) ENGINE=InnoDB;

CREATE TABLE documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    caregiver_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    issued_at DATETIME(6),
    expires_at DATETIME(6),
    signature VARCHAR(255),
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(255),
    received_at DATETIME(6),
    pending_file_name VARCHAR(255),
    pending_file_size INTEGER,
    pending_file_type VARCHAR(255),
    pending_issued_at DATETIME(6),
    pending_expires_at DATETIME(6),
    pending_submitted_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_documents_caregiver FOREIGN KEY (caregiver_id) REFERENCES caregivers (id)
) ENGINE=InnoDB;
